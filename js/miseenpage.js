// Avertissements de mise en page in-jeu (issue #10) : limites d'affichage
// strictes et purement matérielles du moteur PSP, indépendantes du budget
// d'octets (js/budget.js) — un texte peut tenir dans le budget et pourtant
// déborder visuellement à l'écran.
//
// Frontière de page = tout jeton [1205][...] (même regex que le "pause"
// utilisé partout ailleurs : budget.js/_PAUSE, editeur.js:RE_JETON,
// normalise.js) : c'est lui qui vide la boîte de dialogue dans le jeu.
const RE_PAUSE = /\[1205\](?:\[(?:U\+000[0-9A-Fa-f]|001E)\])?/g;
const RE_CODE = /\[[^\]]*\]/g;

export const MAX_CARACTERES_LIGNE = 42;
export const MAX_LIGNES_PAGE = 3;

/** Retire les balises de contrôle (invisibles à l'écran) d'un fragment de texte. */
export function texteVisible(segment) {
  return segment.replace(RE_CODE, "");
}

/**
 * Détecte les dépassements des limites d'affichage du moteur dans un texte
 * brut (avec ses codes) : plus de MAX_LIGNES_PAGE lignes entre deux sauts de
 * page, ou une ligne visible de plus de MAX_CARACTERES_LIGNE caractères.
 * Purement informatif (avertissement), n'a aucun effet sur le budget d'octets.
 * @param {string} brut
 * @returns {{
 *   lignesTropLongues: Array<{page:number, ligne:number, longueur:number}>,
 *   pagesTropLongues: Array<{page:number, nbLignes:number}>
 * }}
 */
export function avertissementsMiseEnPage(brut) {
  const pages = brut.split(RE_PAUSE);
  const lignesTropLongues = [];
  const pagesTropLongues = [];
  pages.forEach((page, iPage) => {
    const lignes = page.split("\n");
    if (lignes.length > MAX_LIGNES_PAGE) {
      pagesTropLongues.push({ page: iPage, nbLignes: lignes.length });
    }
    lignes.forEach((ligne, iLigne) => {
      const longueur = texteVisible(ligne).length;
      if (longueur > MAX_CARACTERES_LIGNE) {
        lignesTropLongues.push({ page: iPage, ligne: iLigne, longueur });
      }
    });
  });
  return { lignesTropLongues, pagesTropLongues };
}

/** Formate les avertissements en messages lisibles (FR), prêts pour textContent. */
export function messagesMiseEnPage(brut) {
  const { lignesTropLongues, pagesTropLongues } = avertissementsMiseEnPage(brut);
  const messages = [];
  for (const p of pagesTropLongues) {
    messages.push(
      `⚠️ Page ${p.page + 1} : ${p.nbLignes} lignes (max ${MAX_LIGNES_PAGE}) — ` +
      `le texte sortira de l'écran. Séparez avec un saut de page ⏸.`);
  }
  for (const l of lignesTropLongues) {
    messages.push(
      `⚠️ Page ${l.page + 1}, ligne ${l.ligne + 1} : ${l.longueur}/${MAX_CARACTERES_LIGNE} ` +
      `caractères — risque de troncature à l'écran.`);
  }
  return messages;
}
