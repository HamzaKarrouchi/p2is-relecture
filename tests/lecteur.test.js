import { describe, it, expect, beforeEach } from "vitest";
import { estHeros, construireBulle, construireChoix, aplatir, rendreFil } from "../js/lecteur.js";

const HEROS = { prenom: "Hamza", nom: "K" };
const PERSOS = { "Eikichi": { emoji: "🎸" } };
const E_SIMPLE = { id: 4, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Yo." }] }], choix_fr: null };
const E_HEROS  = { id: 5, nom_fr: "", bulles_fr: [{ nom: null, seg: [{ t: "..." }] }], choix_fr: null };
const E_MENU   = { id: 6, nom_fr: "Mme Saeko",
  bulles_fr: [{ nom: null, seg: [{ t: "On y va ?" }] }],
  choix_fr: { question: [{ t: "On y va ?" }], options: ["Oui", "Non"] } };

beforeEach(() => { document.body.innerHTML = '<div id="fil"></div>'; });

describe("estHeros", () => {
  it("vrai pour nom vide ou prénom choisi ou Tatsuya", () => {
    expect(estHeros("", HEROS)).toBe(true);
    expect(estHeros("Hamza", HEROS)).toBe(true);
    expect(estHeros("Tatsuya", HEROS)).toBe(true);
    expect(estHeros("Eikichi", HEROS)).toBe(false);
  });
});

describe("construireBulle", () => {
  it("PNJ à gauche avec son nom et son emoji", () => {
    const el = construireBulle(E_SIMPLE, E_SIMPLE.bulles_fr[0], { heros: HEROS, persos: PERSOS });
    expect(el.classList.contains("heros")).toBe(false);
    expect(el.querySelector(".nom").textContent).toBe("Eikichi");
    expect(el.querySelector(".avatar").textContent).toBe("🎸");
  });
  it("héros à droite avec le prénom choisi", () => {
    const el = construireBulle(E_HEROS, E_HEROS.bulles_fr[0], { heros: HEROS, persos: PERSOS });
    expect(el.classList.contains("heros")).toBe(true);
    expect(el.querySelector(".nom").textContent).toBe("Hamza");
  });
});

describe("aplatir + rendreFil", () => {
  it("rend bulles et choix dans l'ordre", () => {
    const blocs = aplatir([E_SIMPLE, E_MENU]);
    rendreFil(document.getElementById("fil"), blocs, { heros: HEROS, persos: PERSOS });
    expect(document.querySelectorAll(".bulle").length).toBeGreaterThanOrEqual(2);
    expect(document.querySelectorAll(".choix button")).toHaveLength(2);
  });
});
