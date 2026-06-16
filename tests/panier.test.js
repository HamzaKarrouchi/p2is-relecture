import { describe, it, expect } from "vitest";
import { formaterExport } from "../js/panier.js";

describe("formaterExport", () => {
  it("groupe par script et formate", () => {
    const txt = formaterExport([
      { script: 62, id: 4, nom_fr: "Bel homme", ancien_nom: "Bel homme",
        ancien_brut: "J'ai des ordres de notre Reine...\nVous mourrez tous ici !",
        brut_fr: "Sur ordre de notre Reine...\nVous mourrez tous ici !", cout: 130 },
    ], { pseudo: "Hamza", budgets: { "62/4": 144 } });
    expect(txt).toContain("Propositions de Hamza");
    expect(txt).toContain("**Script 062**");
    expect(txt).toContain("• id 4 (130/144 o)");
    expect(txt).toContain("ancien : J'ai des ordres de notre Reine...⏎Vous mourrez tous ici !");
    expect(txt).toContain("proposé : Sur ordre de notre Reine...⏎Vous mourrez tous ici !");
    expect(txt).toContain("brut : `Sur ordre de notre Reine...\\nVous mourrez tous ici !`");
  });
  it("mentionne le nom si changé", () => {
    const txt = formaterExport([
      { script: 1, id: 2, nom_fr: "Lycéen", ancien_nom: "Étudiant",
        ancien_brut: "a", brut_fr: "a", cout: 10 }], { pseudo: "X", budgets: { "1/2": 90 } });
    expect(txt).toContain("nom : Étudiant → Lycéen");
  });
});
