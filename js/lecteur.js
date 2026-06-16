import { Etat } from "./etat.js";
import { initTheme, basculerTheme } from "./theme.js";
import { rendreSegments, rendreAvatar } from "./normalise.js";

/**
 * Vrai si cette bulle est dite par le héros (affichée à droite).
 * NB : faux positif connu et accepté — un PNJ dont le nom_fr est exactement le
 * prénom choisi par l'utilisateur (ou « Tatsuya ») sera traité comme le héros.
 */
export function estHeros(nom, heros) {
  return !nom || nom === heros.prenom || nom === "Tatsuya";
}

export function construireBulle(entree, bulle, { heros, persos, indiceBulle = 0 }) {
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
  contenu.append(nomEl, rendreSegments(bulle.seg, heros));
  el.append(contenu);
  return el;
}

export function construireChoix(entree) {
  const bloc = document.createElement("div");
  bloc.className = "choix";
  bloc.dataset.id = entree.id;
  for (const opt of entree.choix_fr.options) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = opt;
    bloc.append(b);
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

/** Rend TOUT le fil d'un coup (v1 — la révélation progressive arrive en T13). */
export function rendreFil(fil, blocs, ctx) {
  fil.replaceChildren();
  for (const b of blocs)
    fil.append(b.type === "bulle"
      ? construireBulle(b.entree, b.bulle, { ...ctx, indiceBulle: b.i })
      : construireChoix(b.entree));
}

// ── Bootstrap navigateur ──────────────────────────────────────────────────
if (document.getElementById("fil")) {
  initTheme();
  document.getElementById("btn-theme").onclick = basculerTheme;
  const no = parseInt(new URLSearchParams(location.search).get("s"), 10);
  const heros = Etat.get("heros", { prenom: "Tatsuya", nom: "Suou" });
  Promise.all([
    fetch(`data/scripts/${String(no).padStart(3, "0")}.json`).then(r => { if (!r.ok) throw new Error("introuvable"); return r.json(); }),
    fetch("data/personnages.json").then(r => r.json()),
    fetch("data/index.json").then(r => r.json()),
  ]).then(([donnees, persos, index]) => {
    const meta = index.find(s => s.no === no);
    document.getElementById("titre").textContent =
      `Script ${String(no).padStart(3, "0")}${meta?.label ? " — " + meta.label : ""}`;
    const blocs = aplatir(donnees.entrees);
    rendreFil(document.getElementById("fil"), blocs, { heros, persos });
    document.getElementById("avancement").textContent = `${blocs.length} bulles`;
    document.getElementById("indicateur").hidden = true;   // v1 : tout est affiché
  }).catch(() => { location.href = "scripts.html"; });     // script inexistant → retour grille
}
