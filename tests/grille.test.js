import { describe, it, expect, beforeEach } from "vitest";
import { initGrille, titreScript } from "../js/grille.js";

describe("titreScript", () => {
  it("utilise le label quand il existe", () => {
    expect(titreScript({ no: 1, label: "Intro", personnages: ["Maya"], repliques: 10 }))
      .toEqual({ texte: "Intro", derive: false, vide: false });
  });
  it("marque les scripts vides « (non traduit) »", () => {
    expect(titreScript({ no: 17, label: "", personnages: [], repliques: 0 }))
      .toEqual({ texte: "(non traduit)", derive: true, vide: true });
  });
  it("déduit un titre des personnages si pas de label", () => {
    const t = titreScript({ no: 18, label: "", personnages: ["Eikichi", "Ginko", "Kozy", "Leader"], repliques: 43 });
    expect(t.texte).toBe("Scène avec Eikichi, Ginko, Kozy");
    expect(t.derive).toBe(true);
    expect(t.vide).toBe(false);
  });
});

const INDEX = [
  { no: 1, label: "Intro", personnages: ["Maya"], repliques: 10 },
  { no: 62, label: "Bel homme", personnages: ["Eikichi", "Yukino"], repliques: 16 },
];
const RECHERCHE = { "001": "bonjour maya", "062": "cercle masqué roi lion" };

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = `
    <span id="stats"></span><button id="btn-theme"></button>
    <input id="q"><select id="filtre-perso"><option value="">Tous</option></select>
    <div id="grille"></div>`;
});

describe("grille", () => {
  it("rend une carte par script", () => {
    initGrille({ index: INDEX, recherche: RECHERCHE });
    expect(document.querySelectorAll(".carte-script")).toHaveLength(2);
  });
  it("filtre par personnage", () => {
    initGrille({ index: INDEX, recherche: RECHERCHE });
    const sel = document.getElementById("filtre-perso");
    sel.value = "Maya"; sel.dispatchEvent(new Event("change"));
    expect(document.querySelectorAll(".carte-script")).toHaveLength(1);
  });
  it("recherche plein texte", () => {
    initGrille({ index: INDEX, recherche: RECHERCHE });
    const q = document.getElementById("q");
    q.value = "roi lion"; q.dispatchEvent(new Event("input"));
    const cartes = document.querySelectorAll(".carte-script");
    expect(cartes).toHaveLength(1);
    expect(cartes[0].href).toContain("s=62");
  });
});
