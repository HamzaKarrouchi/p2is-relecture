import { describe, it, expect, beforeEach, vi } from "vitest";
import { estHeros, construireBulle, construireChoix, aplatir, rendreFil, ecrireMachine, creerLecture } from "../js/lecteur.js";

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

describe("ecrireMachine", () => {
  it("vitesse 0 = instantané", () => {
    const el = document.createElement("div");
    el.innerHTML = '<div class="contenu">Bonjour</div>';
    ecrireMachine(el, 0);
    expect(el.textContent).toBe("Bonjour");
  });
  it("tape progressivement puis finit", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    el.innerHTML = '<div class="contenu">abc</div>';
    ecrireMachine(el, 10);
    expect(el.textContent).toBe("a");
    vi.advanceTimersByTime(10);
    expect(el.textContent).toBe("ab");
    vi.advanceTimersByTime(50);
    expect(el.textContent).toBe("abc");
    vi.useRealTimers();
  });
  it("finir() complète immédiatement", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    el.innerHTML = '<div class="contenu">abcdef</div>';
    const m = ecrireMachine(el, 10);
    m.finir();
    expect(el.textContent).toBe("abcdef");
    vi.useRealTimers();
  });
});

describe("creerLecture", () => {
  const HEROS = { prenom: "H", nom: "K" };
  const ENTREES = [
    { id: 0, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Un" }] }], choix_fr: null },
    { id: 1, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Deux" }] }], choix_fr: null },
  ];
  it("avance bloc par bloc et notifie", () => {
    const fil = document.createElement("div");
    const positions = [];
    const lecture = creerLecture({ fil, blocs: aplatir(ENTREES), ctx: { heros: HEROS, persos: {} },
      vitesse: () => 0, surAvance: p => positions.push(p) });
    lecture.avancer();
    expect(fil.querySelectorAll(".bulle")).toHaveLength(1);
    lecture.avancer();
    expect(fil.querySelectorAll(".bulle")).toHaveLength(2);
    expect(positions).toEqual([1, 2]);
    lecture.avancer();
    expect(lecture.position()).toBe(2);
  });
  it("toutDerouler affiche tout", () => {
    const fil = document.createElement("div");
    const lecture = creerLecture({ fil, blocs: aplatir(ENTREES), ctx: { heros: HEROS, persos: {} }, vitesse: () => 0 });
    lecture.toutDerouler();
    expect(fil.querySelectorAll(".bulle")).toHaveLength(2);
  });
  it("avancer pendant une écriture la complète au lieu d'avancer", () => {
    vi.useFakeTimers();
    const fil = document.createElement("div");
    const lecture = creerLecture({ fil, blocs: aplatir(ENTREES), ctx: { heros: HEROS, persos: {} }, vitesse: () => 10 });
    lecture.avancer();
    lecture.avancer();
    expect(fil.querySelectorAll(".bulle")).toHaveLength(1);
    expect(fil.textContent).toContain("Un");
    vi.useRealTimers();
  });
});
