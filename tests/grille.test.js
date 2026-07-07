import { describe, it, expect, beforeEach } from "vitest";
import { initGrille, titreScript, nomAffiche } from "../js/grille.js";
import { Etat } from "../js/etat.js";

describe("titreScript", () => {
  it("utilise le label quand il existe", () => {
    expect(titreScript({ no: 1, label: "Intro", personnages: ["Maya"], repliques: 10 }))
      .toEqual({ texte: "Intro", derive: false, vide: false });
  });
  it("marque les scripts vides « Script vide »", () => {
    expect(titreScript({ no: 17, label: "", personnages: [], repliques: 0 }))
      .toEqual({ texte: "Script vide", derive: true, vide: true });
  });
  it("déduit un titre des personnages si pas de label", () => {
    const t = titreScript({ no: 18, label: "", personnages: ["Eikichi", "Ginko", "Kozy", "Leader"], repliques: 43 });
    expect(t.texte).toBe("Scène avec Eikichi, Ginko, Kozy");
    expect(t.derive).toBe(true);
    expect(t.vide).toBe(false);
  });
});

describe("nomAffiche", () => {
  const heros = { prenom: "Léo", nom: "Durand" };
  it("remplace [1113] par le prénom choisi", () => {
    expect(nomAffiche("[1113] & Maya", heros)).toBe("Léo & Maya");
    expect(nomAffiche("Ombre de [1113]", heros)).toBe("Ombre de Léo");
  });
  it("remplace [1112] par le nom de famille", () => {
    expect(nomAffiche("[1112]", heros)).toBe("Durand");
  });
  it("laisse les autres labels intacts", () => {
    expect(nomAffiche("Eikichi", heros)).toBe("Eikichi");
  });
});

describe("filtre adapté au protagoniste", () => {
  it("le déroulant affiche le nom choisi mais garde la valeur brute", () => {
    Etat.set("heros", { prenom: "Léo", nom: "Durand" });
    initGrille({
      index: [{ no: 5, label: "Scène", personnages: ["[1113] & Maya"], repliques: 4 }],
      recherche: { "005": "" },
    });
    const opt = [...document.getElementById("filtre-perso").options]
      .find(o => o.value === "[1113] & Maya");
    expect(opt).toBeTruthy();
    expect(opt.textContent).toBe("Léo & Maya");
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
    <button id="btn-reset"></button>
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
  it("le bouton réinitialiser efface la recherche et le filtre personnage", () => {
    initGrille({ index: INDEX, recherche: RECHERCHE });
    const q = document.getElementById("q");
    const sel = document.getElementById("filtre-perso");
    q.value = "roi lion"; q.dispatchEvent(new Event("input"));
    sel.value = "Maya"; sel.dispatchEvent(new Event("change"));
    expect(document.querySelectorAll(".carte-script")).toHaveLength(0);
    document.getElementById("btn-reset").click();
    expect(q.value).toBe("");
    expect(sel.value).toBe("");
    expect(document.querySelectorAll(".carte-script")).toHaveLength(2);
  });
});
