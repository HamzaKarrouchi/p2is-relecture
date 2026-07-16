import { describe, it, expect } from "vitest";
import { texteVisible, avertissementsMiseEnPage, messagesMiseEnPage,
         MAX_CARACTERES_LIGNE, MAX_LIGNES_PAGE } from "../js/miseenpage.js";

describe("texteVisible", () => {
  it("retire les balises de contrôle", () => {
    expect(texteVisible("Salut[1205][001E] toi[1113]!")).toBe("Salut toi!");
  });
  it("laisse le texte sans balise intact", () => {
    expect(texteVisible("Bonjour tout le monde")).toBe("Bonjour tout le monde");
  });
});

describe("avertissementsMiseEnPage", () => {
  it("rien à signaler sur un texte court et court en lignes", () => {
    const r = avertissementsMiseEnPage("Salut!\nComment ça va ?");
    expect(r.lignesTropLongues).toEqual([]);
    expect(r.pagesTropLongues).toEqual([]);
  });

  it("détecte une ligne visible trop longue, sans compter les balises", () => {
    const ligne43 = "a".repeat(43);
    const r = avertissementsMiseEnPage(ligne43);
    expect(r.lignesTropLongues).toEqual([{ page: 0, ligne: 0, longueur: 43 }]);
  });

  it("une ligne de 42 caractères visuels ne déclenche rien (limite incluse)", () => {
    const ligne42 = "a".repeat(MAX_CARACTERES_LIGNE);
    expect(avertissementsMiseEnPage(ligne42).lignesTropLongues).toEqual([]);
  });

  it("des balises de contrôle qui allongent la ligne brute ne comptent pas", () => {
    const ligne = "a".repeat(40) + "[1432][NULL][NULL][0014]";
    expect(avertissementsMiseEnPage(ligne).lignesTropLongues).toEqual([]);
  });

  it("détecte plus de 3 lignes dans une même page (4 lignes = 3 sauts)", () => {
    const r = avertissementsMiseEnPage("Un\nDeux\nTrois\nQuatre");
    expect(r.pagesTropLongues).toEqual([{ page: 0, nbLignes: 4 }]);
  });

  it("3 lignes exactement (limite) ne déclenche rien", () => {
    const r = avertissementsMiseEnPage("Un\nDeux\nTrois");
    expect(r.pagesTropLongues).toEqual([]);
  });

  it("une pause remet le compteur de lignes à zéro (nouvelle page)", () => {
    const brut = "Un\nDeux\nTrois[1205][001E]Quatre\nCinq\nSix";
    const r = avertissementsMiseEnPage(brut);
    expect(r.pagesTropLongues).toEqual([]);
  });

  it("détecte un dépassement sur une page qui n'est pas la première", () => {
    const brut = "Ok.[1205][001E]Un\nDeux\nTrois\nQuatre";
    const r = avertissementsMiseEnPage(brut);
    expect(r.pagesTropLongues).toEqual([{ page: 1, nbLignes: 4 }]);
  });

  it("cumule plusieurs avertissements de types différents", () => {
    const brut = "Un\nDeux\nTrois\nQuatre" + "[1205][001E]" + "b".repeat(50);
    const r = avertissementsMiseEnPage(brut);
    expect(r.pagesTropLongues).toEqual([{ page: 0, nbLignes: 4 }]);
    expect(r.lignesTropLongues).toEqual([{ page: 1, ligne: 0, longueur: 50 }]);
  });
});

describe("messagesMiseEnPage", () => {
  it("renvoie un message par avertissement, vide si rien à signaler", () => {
    expect(messagesMiseEnPage("Court.")).toEqual([]);
  });
  it("mentionne le numéro de page et de ligne (1-indexé, plus parlant)", () => {
    const msgs = messagesMiseEnPage("a".repeat(43));
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toContain("Page 1");
    expect(msgs[0]).toContain("ligne 1");
    expect(msgs[0]).toContain("43/" + MAX_CARACTERES_LIGNE);
  });
});
