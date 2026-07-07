import { describe, it, expect } from "vitest";
import { formaterExport, construireLienIssue, decouperProps, construireLiensIssues } from "../js/panier.js";

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

describe("construireLienIssue", () => {
  it("pointe vers HamzaKarrouchi/P2-FR-IS-PSP par défaut, encode titre/corps/labels", () => {
    const url = construireLienIssue(undefined, "Un titre", "Un corps\navec saut de ligne");
    expect(url).toMatch(/^https:\/\/github\.com\/HamzaKarrouchi\/P2-FR-IS-PSP\/issues\/new\?/);
    expect(url).toContain("title=Un%20titre");
    expect(url).toContain("body=Un%20corps%0Aavec%20saut%20de%20ligne");
    expect(url).toContain("labels=relecture");
  });
  it("respecte le dépôt et les labels fournis", () => {
    const url = construireLienIssue({ owner: "X", repo: "Y" }, "T", "C", []);
    expect(url).toBe("https://github.com/X/Y/issues/new?title=T&body=C");
  });
});

describe("decouperProps / construireLiensIssues", () => {
  const prop = (script, id) => ({
    script, id, nom_fr: "N", ancien_nom: "N",
    ancien_brut: "a".repeat(80), brut_fr: "b".repeat(80), cout: 80,
  });

  it("un seul lien pour un petit panier", () => {
    const props = [prop(1, 0), prop(1, 1), prop(2, 0)];
    const liens = construireLiensIssues(props, { pseudo: "X", budgets: {} });
    expect(liens).toHaveLength(1);
    expect(liens[0].titre).toBe("Propositions de X — P2IS Relecture");
    expect(liens[0].url.length).toBeLessThan(2000);
  });

  it("scinde en plusieurs lots quand l'URL dépasserait la limite", () => {
    const props = Array.from({ length: 200 }, (_, i) => prop(i, 0));
    const chunks = decouperProps(props, { pseudo: "X", budgets: {} });
    expect(chunks.length).toBeGreaterThan(1);
    const total = chunks.reduce((n, c) => n + c.length, 0);
    expect(total).toBe(200);   // aucune proposition perdue au découpage
    const liens = construireLiensIssues(props, { pseudo: "X", budgets: {} });
    expect(liens).toHaveLength(chunks.length);
    expect(liens[0].titre).toBe(`Propositions de X — P2IS Relecture (1/${chunks.length})`);
    for (const l of liens) expect(l.url.length).toBeLessThan(9000);
  });
});
