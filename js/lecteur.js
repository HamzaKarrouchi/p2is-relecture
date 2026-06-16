import { Etat } from "./etat.js";
import { initTheme, basculerTheme } from "./theme.js";
import { rendreSegments, rendreAvatar } from "./normalise.js";
import { chargerDico, marquerTermes, incoherences } from "./dico.js";
import { ouvrirEditeur } from "./editeur.js";
import { ouvrirPanier } from "./panier.js";

/**
 * Vrai si cette bulle est dite par le héros (affichée à droite).
 * NB : faux positif connu et accepté — un PNJ dont le nom_fr est exactement le
 * prénom choisi par l'utilisateur (ou « Tatsuya ») sera traité comme le héros.
 */
export function estHeros(nom, heros) {
  return !nom || nom === heros.prenom || nom === "Tatsuya";
}

export function construireBulle(entree, bulle, { heros, persos, indiceBulle = 0, dico = [], surEditer }) {
  const nom = bulle.nom ?? entree.nom_fr;
  const el = document.createElement("div");
  const heroBulle = estHeros(nom, heros);
  el.className = "bulle" + (heroBulle ? " heros" : "");
  el.dataset.id = entree.id; el.dataset.bulle = indiceBulle;
  el.append(rendreAvatar(nom || "?", heroBulle ? { portrait: "Tatsuya.webp" } : persos[nom]));
  const contenu = document.createElement("div");
  contenu.className = "contenu";
  const nomEl = document.createElement("div");
  nomEl.className = "nom";
  nomEl.textContent = heroBulle ? heros.prenom : (nom || "—");
  const pbs = (entree.brut_en && entree.brut_fr) ? incoherences(entree.brut_en, entree.brut_fr, dico) : [];
  if (pbs.length) {
    const warn = document.createElement("span");
    warn.className = "warn"; warn.textContent = "⚠";
    warn.title = pbs.join(" ; ");
    nomEl.append(warn);
  }
  const frWrap = rendreSegments(bulle.seg, heros);
  frWrap.classList.add("fr");
  marquerTermes(frWrap, dico);
  contenu.append(nomEl, frWrap);
  const enWrap = document.createElement("div");
  enWrap.className = "version-en";
  const bulleEn = entree.bulles_en?.[indiceBulle] ?? entree.bulles_en?.[0];
  if (bulleEn) enWrap.append(rendreSegments(bulleEn.seg, heros));
  contenu.append(enWrap);
  const btnSwap = document.createElement("button");
  btnSwap.className = "swap"; btnSwap.textContent = "🔁"; btnSwap.title = "FR ↔ EN";
  btnSwap.onclick = (ev) => { ev.stopPropagation(); el.classList.toggle("montre-en"); };
  contenu.append(btnSwap);
  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.className = "edit"; btnEdit.dataset.edit = ""; btnEdit.textContent = "✏️"; btnEdit.title = "Éditer";
  btnEdit.onclick = (ev) => { ev.stopPropagation(); surEditer?.(entree, el); };
  contenu.append(btnEdit);
  el.append(contenu);
  return el;
}

export function construireChoix(entree) {
  const bloc = document.createElement("div");
  bloc.className = "choix";
  bloc.dataset.id = entree.id;
  const optionsEn = entree.choix_en?.options;
  entree.choix_fr.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = opt;
    if (optionsEn) b.title = optionsEn[i] ?? "";
    bloc.append(b);
  });
  if (optionsEn) {
    const enLigne = document.createElement("div");
    enLigne.className = "version-en";
    enLigne.textContent = optionsEn.join(" / ");
    bloc.append(enLigne);
  }
  return bloc;
}

/**
 * Aplatit les entrées en blocs à afficher dans l'ordre.
 *
 * Réalité des données observée sur data/scripts/001.json :
 * Pour les entrées avec choix_fr, bulles_fr contient DÉJÀ la question
 * (sync.py appelle en_bulles(q_fr) lors de la présence d'un choix).
 * On génère donc : bulle(s) de la question depuis bulles_fr, puis bloc choix.
 * bulles_fr n'est pas vide pour ces entrées — le code ci-dessous est correct.
 */
export function aplatir(entrees) {
  const blocs = [];
  for (const e of entrees) {
    e.bulles_fr.forEach((b, i) => blocs.push({ type: "bulle", entree: e, bulle: b, i }));
    if (e.choix_fr) blocs.push({ type: "choix", entree: e });
  }
  return blocs;
}

/** Rend TOUT le fil d'un coup (conservé pour les tests ; plus utilisé par le bootstrap depuis T13). */
export function rendreFil(fil, blocs, ctx) {
  fil.replaceChildren();
  for (const b of blocs)
    fil.append(b.type === "bulle"
      ? construireBulle(b.entree, b.bulle, { ...ctx, indiceBulle: b.i })
      : construireChoix(b.entree));
}

/**
 * Machine à écrire : vide puis retape les nœuds texte d'un élément de bulle.
 * @param elBulle  élément .bulle déjà inséré au DOM
 * @param vitesse  ms/caractère (0 = instantané)
 * @returns {{promesse: Promise, finir: Function}} — finir() complète immédiatement.
 */
export function ecrireMachine(elBulle, vitesse) {
  const morceaux = [];
  // On ne tape QUE le texte FR visible (.fr) : jamais la version EN cachée ni le
  // bouton 🔁 (.swap), dont l'emoji hors-BMP serait corrompu par la frappe.
  (function collecter(n) {
    for (const enfant of [...n.childNodes]) {
      if (enfant.nodeType === Node.TEXT_NODE && enfant.textContent) {
        morceaux.push({ noeud: enfant, chars: [...enfant.textContent] });
        enfant.textContent = "";
      } else if (enfant.classList?.contains("pause")) {
        morceaux.push({ pause: true });
      } else if (enfant.childNodes) collecter(enfant);
    }
  })(elBulle.querySelector(".fr") ?? elBulle.querySelector(".contenu") ?? elBulle);
  let fini = false;
  let resoudre;
  const promesse = new Promise(res => { resoudre = res; });
  function finir() {
    if (fini) return;
    fini = true;
    for (const m of morceaux) if (!m.pause) m.noeud.textContent = m.chars.join("");
    resoudre();
  }
  if (vitesse === 0) { finir(); return { promesse, finir }; }
  let i = 0, j = 0;
  (function tick() {
    if (fini) return;
    if (i >= morceaux.length) return finir();
    const m = morceaux[i];
    if (m.pause) { i++; setTimeout(tick, vitesse * 9); return; }   // micro-pause du jeu
    m.noeud.textContent = m.chars.slice(0, ++j).join("");          // découpe par point de code
    if (j >= m.chars.length) { i++; j = 0; }
    setTimeout(tick, vitesse);
  })();
  return { promesse, finir };
}

/**
 * Crée le contrôleur de lecture progressive.
 * @param opts {fil, blocs, ctx, vitesse: () => number, surAvance: (position, bloc) => void}
 * Retourne { avancer, toutDerouler, position() }.
 */
export function creerLecture({ fil, blocs, ctx, vitesse = () => 28, surAvance = () => {} }) {
  let position = 0;
  let enCours = null;        // {finir} de l'écriture en cours
  let choixEnAttente = false;
  /** Arme un bloc choix déjà inséré : bloque la lecture jusqu'au clic d'une option. */
  function armerChoix(el) {
    choixEnAttente = true;
    const boutons = [...el.querySelectorAll("button")];
    for (const b of boutons) {
      b.onclick = (ev) => {
        ev.stopPropagation();
        if (!choixEnAttente) return;
        choixEnAttente = false;
        for (const autre of boutons) autre.classList.add(autre === b ? "elu" : "fane");
        avancer();
      };
    }
  }
  function avancer() {
    if (choixEnAttente) return;
    if (enCours) { enCours.finir(); enCours = null; return; }
    if (position >= blocs.length) return;
    const b = blocs[position++];
    const el = b.type === "bulle"
      ? construireBulle(b.entree, b.bulle, { ...ctx, indiceBulle: b.i })
      : construireChoix(b.entree);
    fil.append(el);
    el.scrollIntoView?.({ behavior: "smooth", block: "end" });
    if (b.type === "bulle") {
      const v = vitesse();
      if (v > 0) {
        enCours = ecrireMachine(el, v);
        enCours.promesse.then(() => { enCours = null; });
      }
    } else {
      armerChoix(el);
    }
    surAvance(position, b);
  }
  /** Insère les blocs jusqu'à `cible` instantanément, sans armer les choix.
   *  Utilisé pour la reprise de lecture : un choix déjà franchi lors d'une session
   *  précédente ne doit pas re-bloquer le rejeu. */
  function rejouerJusque(cible) {
    if (enCours) { enCours.finir(); enCours = null; }
    choixEnAttente = false;
    while (position < cible && position < blocs.length) {
      const b = blocs[position++];
      fil.append(b.type === "bulle"
        ? construireBulle(b.entree, b.bulle, { ...ctx, indiceBulle: b.i })
        : construireChoix(b.entree));
      surAvance(position, b);
    }
  }
  function toutDerouler() { rejouerJusque(blocs.length); }
  return { avancer, toutDerouler, rejouerJusque, position: () => position };
}

// ── Bootstrap navigateur ──────────────────────────────────────────────────
if (document.getElementById("fil")) {
  initTheme();
  document.getElementById("btn-theme").onclick = basculerTheme;
  const no = parseInt(new URLSearchParams(location.search).get("s"), 10);
  const heros = Etat.get("heros", { prenom: "Tatsuya", nom: "Suou" });
  const fil = document.getElementById("fil");
  Promise.all([
    fetch(`data/scripts/${String(no).padStart(3, "0")}.json`).then(r => { if (!r.ok) throw new Error("introuvable"); return r.json(); }),
    fetch("data/personnages.json").then(r => r.json()),
    fetch("data/index.json").then(r => r.json()),
    chargerDico(),
  ]).then(([donnees, persos, index, dico]) => {
    const meta = index.find(s => s.no === no);
    const titre = `Script ${String(no).padStart(3, "0")}${meta?.label ? " — " + meta.label : ""}`;
    document.getElementById("titre").textContent = titre;
    document.title = titre;

    const blocs = aplatir(donnees.entrees);

    function majBarre(pos) {
      document.getElementById("avancement").textContent = `${pos}/${blocs.length}`;
      document.getElementById("fin").hidden = pos < blocs.length;
      document.getElementById("indicateur").hidden = pos >= blocs.length;
    }

    function majBadgePanier() {
      const n = Etat.panier().length;
      document.getElementById("badge-panier").textContent = n || "";
    }
    majBadgePanier();

    const budgetsDuScript = Object.fromEntries(
      donnees.entrees.map(e => [`${no}/${e.id}`, e.budget])
    );
    document.getElementById("btn-panier").onclick = () => ouvrirPanier(budgetsDuScript, majBadgePanier);

    let rejeu = true;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lecture = creerLecture({
      fil, blocs, ctx: {
        heros, persos, dico,
        surEditer: (entree, el) => ouvrirEditeur(entree, (prop) => {
          Etat.panierAjouter({ script: no, id: entree.id, ...prop,
                               ancien_brut: entree.brut_fr, ancien_nom: entree.nom_fr });
          el.classList.add("modifiee");
          majBadgePanier();
        }),
      },
      vitesse: () => (rejeu || reduit) ? 0 : Etat.get("vitesse", 28),
      surAvance: (pos) => { Etat.set(`pos.${no}`, pos); majBarre(pos); },
    });

    const cible = Math.min(Etat.get(`pos.${no}`, 0), blocs.length);
    lecture.rejouerJusque(cible);         // reprise instantanée, sans re-bloquer sur un choix
    rejeu = false;
    if (cible === 0) lecture.avancer();   // montrer la 1re bulle

    // Infobulle dico : une seule instance réutilisée, fermée au clic ailleurs.
    let infobulle = null;
    function fermerInfobulle() {
      infobulle?.remove();
      infobulle = null;
    }
    fil.addEventListener("click", (ev) => {
      const mot = ev.target.closest(".mot-dico");
      if (mot) {
        ev.stopPropagation();
        fermerInfobulle();
        infobulle = document.createElement("div");
        infobulle.className = "infobulle";
        const ligneEn = document.createElement("div");
        ligneEn.textContent = `EN : ${mot.dataset.en}`;
        const lien = document.createElement("a");
        lien.href = "dictionnaire.html";
        lien.textContent = "voir le dictionnaire";
        infobulle.append(ligneEn, lien);
        document.body.append(infobulle);
        const r = mot.getBoundingClientRect();
        infobulle.style.left = `${r.left + window.scrollX}px`;
        infobulle.style.top = `${r.bottom + window.scrollY + 4}px`;
        return;
      }
      if (ev.target.closest(".choix") || ev.target.closest("button")) return;
      lecture.avancer();
    });
    document.addEventListener("click", (ev) => {
      if (infobulle && !ev.target.closest(".infobulle") && !ev.target.closest(".mot-dico")) fermerInfobulle();
    });
    document.getElementById("indicateur").addEventListener("click", () => lecture.avancer());
    document.addEventListener("keydown", (ev) => {
      if (ev.code !== "Space") return;
      if (ev.target.closest?.("input, textarea, [contenteditable]")) return;
      ev.preventDefault();
      lecture.avancer();
    });
    document.getElementById("btn-derouler").onclick = () => lecture.toutDerouler();
    document.getElementById("cmp").onchange = (ev) =>
      document.body.classList.toggle("compare", ev.target.checked);
  }).catch(() => { location.href = "scripts.html"; });     // script inexistant → retour grille
}
