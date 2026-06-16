import { describe, it, expect } from "vitest";
import { brutVersJetons, jetonsVersBrut } from "../js/editeur.js";

describe("aller-retour brut ↔ jetons", () => {
  const cas = [
    "Bonjour.",
    "Oui.[1205][U+000F] Non.\nFin",
    "Salut [1113] [1112] !",
    "[1432][NULL][NULL][0014]Armes[1432][NULL][NULL][0014] ici",
    "a[E1][E2][U+0159]b",
  ];
  for (const brut of cas) {
    it(`préserve « ${brut.slice(0, 30)} »`, () => {
      expect(jetonsVersBrut(brutVersJetons(brut))).toBe(brut);
    });
  }
  it("découpe en jetons typés", () => {
    const j = brutVersJetons("Oui.[1205][U+000F]\nNon");
    expect(j).toEqual([
      { type: "texte", v: "Oui." },
      { type: "code", v: "[1205][U+000F]", icone: "⏸" },
      { type: "code", v: "\n", icone: "⏎" },
      { type: "texte", v: "Non" },
    ]);
  });
});
