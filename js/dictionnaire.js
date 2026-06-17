import { initTheme, basculerTheme } from "./theme.js";

/**
 * Filtre les entrées du dico dont EN ou FR contient `q` (insensible casse).
 * @param {Array<{en: string, fr: string}>} dico
 * @param {string} q
 * @returns {Array<{en: string, fr: string}>}
 */
export function lignesFiltrees(dico, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return dico;
  return dico.filter(t =>
    t.en.toLowerCase().includes(needle) || t.fr.toLowerCase().includes(needle));
}

/**
 * Construit une ligne <tr> EN | FR pour le tableau du glossaire.
 * @param {{en: string, fr: string}} terme
 * @returns {HTMLTableRowElement}
 */
export function construireLigne(terme) {
  const tr = document.createElement("tr");
  const tdEn = document.createElement("td");
  tdEn.className = "en"; tdEn.textContent = terme.en;
  const tdFr = document.createElement("td");
  tdFr.className = "fr"; tdFr.textContent = terme.fr;
  tr.append(tdEn, tdFr);
  return tr;
}

/** Rend le tableau complet à partir des lignes filtrées. */
export function rendreTableau(corps, dico, q) {
  corps.replaceChildren();
  for (const t of lignesFiltrees(dico, q)) corps.append(construireLigne(t));
}

// ── Bootstrap navigateur ──────────────────────────────────────────────────
if (document.getElementById("tableau-dico")) {
  initTheme();
  const btnTheme = document.getElementById("btn-theme");
  if (btnTheme) btnTheme.onclick = basculerTheme;

  fetch("data/dictionnaire.json").then(r => r.json()).then(dico => {
    const corps = document.querySelector("#tableau-dico tbody");
    const champ = document.getElementById("q");
    // Pré-remplissage depuis ?q= (clic sur un terme doré dans le lecteur)
    const q0 = new URLSearchParams(location.search).get("q") || "";
    if (q0) champ.value = q0;
    rendreTableau(corps, dico, q0);
    champ.addEventListener("input", () => rendreTableau(corps, dico, champ.value));
    if (q0) champ.focus();
  }).catch(err => {
    console.error("Erreur chargement dictionnaire :", err);
    document.getElementById("tableau-dico").textContent =
      "Erreur : impossible de charger data/dictionnaire.json";
  });
}
