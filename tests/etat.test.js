import { describe, it, expect, beforeEach } from "vitest";
import { Etat } from "../js/etat.js";

beforeEach(() => localStorage.clear());

describe("Etat", () => {
  it("retourne le défaut si absent", () => {
    expect(Etat.get("theme", "nuit")).toBe("nuit");
  });
  it("écrit/relit (JSON)", () => {
    Etat.set("heros", { prenom: "Tatsuya", nom: "Suou" });
    expect(Etat.get("heros", null)).toEqual({ prenom: "Tatsuya", nom: "Suou" });
  });
  it("relu(): bascule la progression d'un script", () => {
    expect(Etat.estRelu(62)).toBe(false);
    Etat.marquerRelu(62, true);
    expect(Etat.estRelu(62)).toBe(true);
    Etat.marquerRelu(62, false);
    expect(Etat.estRelu(62)).toBe(false);
  });
  it("panier: ajoute/remplace par (script,id), retire", () => {
    Etat.panierAjouter({ script: 62, id: 4, nom_fr: "X", brut_fr: "a", cout: 10 });
    Etat.panierAjouter({ script: 62, id: 4, nom_fr: "X", brut_fr: "b", cout: 12 });
    expect(Etat.panier()).toHaveLength(1);
    expect(Etat.panier()[0].brut_fr).toBe("b");
    Etat.panierRetirer(62, 4);
    expect(Etat.panier()).toHaveLength(0);
  });
  it("export/import de sauvegarde", () => {
    Etat.set("pseudo", "Hamza");
    const sauvegarde = Etat.exporter();
    localStorage.clear();
    Etat.importer(sauvegarde);
    expect(Etat.get("pseudo", "")).toBe("Hamza");
  });
  it("survit à un localStorage indisponible", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("quota"); };
    expect(() => Etat.set("x", 1)).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
