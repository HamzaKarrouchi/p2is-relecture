import { describe, it, expect } from "vitest";
import { voisins, vitesseSuivante, iconeVitesse } from "../js/lecteur.js";

describe("voisins", () => {
  it("milieu", () => expect(voisins([1,5,9], 5)).toEqual({ prec: 1, suiv: 9 }));
  it("début", () => expect(voisins([1,5,9], 1)).toEqual({ prec: null, suiv: 5 }));
  it("fin", () => expect(voisins([1,5,9], 9)).toEqual({ prec: 5, suiv: null }));
  it("absent", () => expect(voisins([1,5,9], 7)).toEqual({ prec: null, suiv: null }));
});

describe("vitesse", () => {
  it("cycle", () => {
    expect(vitesseSuivante(28)).toBe(12);
    expect(vitesseSuivante(12)).toBe(0);
    expect(vitesseSuivante(0)).toBe(28);
  });
  it("icônes", () => {
    expect(iconeVitesse(28)).toBe("🐢");
    expect(iconeVitesse(12)).toBe("🐇");
    expect(iconeVitesse(0)).toBe("⚡");
  });
});
