import { Etat } from "./etat.js";
import { initTheme, basculerTheme } from "./theme.js";

/**
 * Génère un élément <a> de carte pour un script.
 * @param {object} s      - entrée de data/index.json
 * @param {object} [etat] - objet compatible Etat (injectable en test)
 */
/**
 * Titre affiché pour un script : le label s'il existe, sinon un repli déduit des
 * personnages présents, sinon « Script vide » pour les scripts sans réplique.
 * @returns {{ texte: string, derive: boolean, vide: boolean }}
 */
/**
 * Substitue les placeholders du protagoniste dans un libellé de personnage :
 * `[1113]` → prénom choisi, `[1112]` → nom de famille choisi. Sert à l'affichage
 * (le déroulant garde la valeur brute pour le filtrage).
 */
export function nomAffiche(label, heros) {
  return String(label)
    .split("[1113]").join(heros?.prenom || "Tatsuya")
    .split("[1112]").join(heros?.nom || "Suou");
}

export function titreScript(s) {
  if (s.repliques === 0) return { texte: "Script vide", derive: true, vide: true };
  if (s.label) return { texte: s.label, derive: false, vide: false };
  if (s.personnages.length)
    return { texte: "Scène avec " + s.personnages.slice(0, 3).join(", "), derive: true, vide: false };
  return { texte: "Sans titre", derive: true, vide: false };
}

export function carte(s, etat = Etat) {
  const relu = etat.estRelu(s.no);
  const enCours = etat.panier().some(x => x.script === s.no);
  const t = titreScript(s);
  const el = document.createElement("a");
  el.className = "carte-script" + (relu ? " relu" : "") + (t.vide ? " vide" : "");
  el.href = `lecture.html?s=${s.no}`;
  // textContent partout : les labels/noms viennent des données de trad,
  // jamais interprétés comme HTML.
  const no = document.createElement("div");
  no.className = "no";
  no.textContent = `${String(s.no).padStart(3, "0")} ${relu ? "✓" : ""} ${enCours ? "📝" : ""}`.trim();
  const label = document.createElement("div");
  label.className = "label";
  if (t.derive) { const i = document.createElement("i"); i.textContent = t.texte; label.append(i); }
  else label.textContent = t.texte;
  const persos = document.createElement("div");
  persos.className = "persos";
  persos.textContent = s.personnages.slice(0, 4).join(", ") + (s.personnages.length > 4 ? "…" : "");
  const compte = document.createElement("div");
  compte.className = "compte";
  compte.textContent = `${s.repliques} répliques`;
  el.append(no, label, persos, compte);
  return el;
}

/**
 * Initialise la grille : peuple le select personnages, pose les listeners et
 * effectue un premier rendu.
 * @param {{ index: object[], recherche: object, etat?: object }} opts
 */
export function initGrille({ index, recherche, etat = Etat }) {
  const grille = document.getElementById("grille");
  const sel = document.getElementById("filtre-perso");

  // Peuple le select avec les personnages uniques : le placeholder du héros
  // ([1113]/[1112]) est remplacé par le nom choisi à l'affichage, la valeur
  // reste brute pour que le filtrage continue de matcher s.personnages.
  const heros = etat.get("heros", { prenom: "Tatsuya", nom: "Suou" });
  const persos = [...new Set(index.flatMap(s => s.personnages))]
    .sort((a, b) => nomAffiche(a, heros).localeCompare(nomAffiche(b, heros), "fr"));
  for (const p of persos) sel.add(new Option(nomAffiche(p, heros), p));

  function rendre() {
    const q = document.getElementById("q").value.trim().toLowerCase();
    const fp = sel.value;
    grille.replaceChildren();
    let visibles = 0;
    for (const s of index) {
      const cle = String(s.no).padStart(3, "0");
      if (fp && !s.personnages.includes(fp)) continue;
      if (q && !cle.includes(q) && !(s.label || "").toLowerCase().includes(q)
            && !(recherche[cle] || "").includes(q)) continue;
      grille.append(carte(s, etat));
      visibles++;
    }
    const statsEl = document.getElementById("stats");
    if (statsEl) {
      statsEl.textContent =
        `${index.filter(s => etat.estRelu(s.no)).length}/${index.length} relus · ${visibles} affichés`;
    }
  }

  document.getElementById("q").addEventListener("input", rendre);
  sel.addEventListener("change", rendre);
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    document.getElementById("q").value = "";
    sel.value = "";
    rendre();
  });
  rendre();
}

// Bootstrap navigateur — se déclenche uniquement si le DOM contient déjà un #grille
// au moment où le module est évalué, ce qui n'est jamais le cas dans les tests
// (le DOM est injecté dans beforeEach, APRÈS le chargement du module).
if (document.getElementById("grille")) {
  initTheme();
  const btnTheme = document.getElementById("btn-theme");
  if (btnTheme) btnTheme.onclick = basculerTheme;

  Promise.all([
    fetch("data/index.json").then(r => r.json()),
    fetch("data/recherche.json").then(r => r.json()),
  ]).then(([index, recherche]) => {
    initGrille({ index, recherche });
  }).catch(err => {
    console.error("Erreur chargement données grille :", err);
    document.getElementById("grille").textContent =
      "Erreur : impossible de charger data/index.json — lancer « python3 sync.py » ?";
  });
}
