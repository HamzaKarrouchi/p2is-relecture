// Dictionnaire de terminologie validée : coloration des termes FR dans les
// bulles, détection d'incohérence de traduction EN→FR.

let _dico = null;
export async function chargerDico() {
  _dico ??= await fetch("data/dictionnaire.json").then(r => r.json());
  return _dico;
}
const echapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Entoure d'un <span class="mot-dico"> la première occurrence de chaque
 * terme FR connu trouvée dans les nœuds texte de `racine`.
 * Un seul terme marqué par nœud texte (le plus long en priorité).
 * @param {Element} racine
 * @param {Array<{en: string, fr: string}>} dico
 */
export function marquerTermes(racine, dico) {
  const termes = [...dico].filter(t => t.fr.length > 2)
                          .sort((a, b) => b.fr.length - a.fr.length);
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const noeuds = [];
  while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
  for (const n of noeuds) {
    if (n.parentElement.closest(".mot-dico")) continue;
    let txt = n.textContent, frag = null;
    for (const t of termes) {
      const re = new RegExp(`(^|\\P{L})(${echapper(t.fr)})(\\P{L}|$)`, "u");
      const m = re.exec(txt);
      if (!m) continue;
      frag = document.createDocumentFragment();
      frag.append(txt.slice(0, m.index) + m[1]);
      const mot = document.createElement("span");
      mot.className = "mot-dico"; mot.textContent = m[2];
      mot.dataset.en = t.en;
      frag.append(mot, txt.slice(m.index + m[1].length + m[2].length));
      break;
    }
    if (frag) n.replaceWith(frag);
  }
}

/**
 * Liste les incohérences de terminologie : un terme EN du dico apparaît
 * dans `brutEn` mais sa traduction validée (1re variante avant « / ») est
 * absente de `brutFr`.
 * @param {string} brutEn
 * @param {string} brutFr
 * @param {Array<{en: string, fr: string}>} dico
 * @returns {string[]} ex. ["Last Battalion → Bataillon"]
 */
export function incoherences(brutEn, brutFr, dico) {
  const en = brutEn.replace(/\[SP\]/g, " ").toLowerCase();
  const fr = brutFr.replace(/\[SP\]/g, " ").toLowerCase();
  const probs = [];
  for (const t of dico) {
    // Termes à variantes « a/b » des deux côtés : EN match si AU MOINS une variante
    // est présente ; FR considéré correct si AU MOINS une variante validée apparaît.
    const variantesEn = t.en.split("/").map(s => s.trim().toLowerCase()).filter(Boolean);
    const variantesFr = t.fr.split("/").map(s => s.trim().toLowerCase()).filter(Boolean);
    const enPresent = variantesEn.some(v => en.includes(v));
    const frPresent = variantesFr.some(v => fr.includes(v));
    if (enPresent && !frPresent)
      probs.push(`${t.en} → ${t.fr.split("/")[0].trim()}`);
  }
  return probs;
}
