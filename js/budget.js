// Portage EXACT de json_verify/utils.py:estimate_bytes — ne pas "améliorer".
const REPLS = [["é","Ğ"],["è","ò"],["ê","¿"],["ô","Æ"],["É","Ņ"],
               ["È","Ũ"],["Î","£"],["Ô","ō"],["Û","ĵ"],["œ","ë"],["Œ","Ǩ"]];
const CTRL_TAGS = new Set(["[SP]","\n","[E1]","[E2]","[E3]","[E4]","[1205]","[001E]",
                           "[1432]","[0014]","[0002]","[0010]","[NULL]"]);

export function estimateBytes(text) {
  for (const [a, b] of REPLS) text = text.split(a).join(b);
  let count = 0, i = 0;
  while (i < text.length) {
    if (text[i] === "[") {
      const end = text.indexOf("]", i);
      if (end === -1) return -1;
      const tag = text.slice(i, end + 1);
      if (tag === "[NULL]") { count += 2; i = end + 1; continue; }
      const found = CTRL_TAGS.has(tag) ||
                    (tag.startsWith("[U+") && tag.length === 8) ||
                    tag.length === 6;
      count += found ? 2 : (tag.length - 2) * 2;
      i = end + 1;
    } else { count += 2; i += 1; }
  }
  return count;
}

export const cost = (nomFr, texteFr) => estimateBytes('"' + nomFr + "\n" + texteFr + "\n");
export const budgetOf = (dataSize) => dataSize - 8;

// Caractères affichables par le jeu (liste du CLAUDE.md de la trad)
const ACCENTS_OK = "éèêàçùâîôûœüïÉÈÊÀÇÙÂÎÔÛŒ";
export function caracteresInterdits(texte) {
  const sansBalises = texte.replace(/\[[^\]]*\]/g, "");
  const interdits = [];
  for (const ch of sansBalises) {
    if (ch === "\n") continue;
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp <= 0x7e) continue;
    if (ACCENTS_OK.includes(ch)) continue;
    if (!interdits.includes(ch)) interdits.push(ch);
  }
  return interdits;
}
