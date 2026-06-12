import { describe, it, expect } from "vitest";
import { estimateBytes, cost, budgetOf, caracteresInterdits } from "../js/budget.js";
import fixtures from "./fixtures-budget.json";

describe("estimateBytes (portage json_verify/utils.py)", () => {
  it("compte 2 octets par caractère standard", () => {
    expect(estimateBytes("Oui")).toBe(6);
  });
  it("compte les accents remplacés comme 2 octets", () => {
    expect(estimateBytes("é")).toBe(2);
    expect(estimateBytes("Étoile")).toBe(12);
  });
  it("compte les balises connues comme 2 octets", () => {
    expect(estimateBytes("[1205][U+000F]")).toBe(4);
    expect(estimateBytes("[SP]")).toBe(2);
  });
  it("compte [NULL] comme json_verify", () => {
    expect(estimateBytes("[NULL]")).toBe(2);
  });
  it("retourne -1 sur crochet non fermé", () => {
    expect(estimateBytes("Texte[1205")).toBe(-1);
  });
  it("cost = guillemet + nom + \\n + texte + \\n", () => {
    expect(cost("Lisa", "Oui")).toBe(20);
  });
  it("budgetOf = data_size - 8", () => {
    expect(budgetOf(152)).toBe(144);
  });
});

describe("caracteresInterdits", () => {
  it("accepte ASCII + accents supportés + \\n", () => {
    expect(caracteresInterdits("Ça va, Tatsuya ?\nœuf à l'île")).toEqual([]);
  });
  it("rejette tiret cadratin, emoji, accents hors liste", () => {
    expect(caracteresInterdits("a — b")).toEqual(["—"]);
    expect(caracteresInterdits("ñ")).toEqual(["ñ"]);
  });
  it("ignore le contenu des balises", () => {
    expect(caracteresInterdits("[U+000F]ok")).toEqual([]);
  });
});

describe("validation croisée sur entrées réelles", () => {
  it("colle à json_verify sur des entrées réelles", () => {
    for (const c of fixtures) expect(cost(c.nom, c.texte)).toBe(c.attendu);
  });
});
