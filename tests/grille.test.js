import { describe, it, expect, beforeEach } from "vitest";
import { initGrille } from "../js/grille.js";

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
