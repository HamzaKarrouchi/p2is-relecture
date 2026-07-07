import { describe, it, expect, beforeEach, vi } from "vitest";
import { estHeros, construireBulle, construireChoix, aplatir, rendreFil, ecrireMachine, creerLecture } from "../js/lecteur.js";

const HEROS = { prenom: "Hamza", nom: "K" };
const PERSOS = { "Eikichi": { emoji: "🎸" } };
const E_SIMPLE = { id: 4, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Yo." }] }], choix_fr: null };
const E_HEROS  = { id: 5, nom_fr: "", bulles_fr: [{ nom: null, seg: [{ t: "..." }] }], choix_fr: null };
const E_MENU   = { id: 6, nom_fr: "Mme Saeko",
  bulles_fr: [{ nom: null, seg: [{ t: "On y va ?" }] }],
  choix_fr: { question: [{ t: "On y va ?" }], options: ["Oui", "Non"] } };
const E_AVEC_EN = { id: 7, nom_fr: "Eikichi",
  bulles_fr: [{ nom: null, seg: [{ t: "Yo." }] }],
  bulles_en: [{ nom: null, seg: [{ t: "Yo." }] }],
  choix_fr: null };
const E_SANS_EN = { id: 8, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Yo." }] }], choix_fr: null };
const E_MENU_EN = { id: 9, nom_fr: "Mme Saeko",
  bulles_fr: [{ nom: null, seg: [{ t: "On y va ?" }] }],
  choix_fr: { question: [{ t: "On y va ?" }], options: ["Oui", "Non"] },
  choix_en: { question: [{ t: "Shall we go?" }], options: ["Yes", "No"] } };

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
    expect(document.querySelectorAll(".choix button.option")).toHaveLength(2);
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

describe("creerLecture — choix interactifs (T14)", () => {
  const HEROS = { prenom: "H", nom: "K" };
  const ENTREES_CHOIX = [
    { id: 0, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Un" }] }], choix_fr: null },
    { id: 1, nom_fr: "Mme Saeko",
      bulles_fr: [{ nom: null, seg: [{ t: "On y va ?" }] }],
      choix_fr: { question: [{ t: "On y va ?" }], options: ["Oui", "Non"] } },
    { id: 2, nom_fr: "Eikichi", bulles_fr: [{ nom: null, seg: [{ t: "Après" }] }], choix_fr: null },
  ];
  function avancerAuChoix() {
    const fil = document.createElement("div");
    const lecture = creerLecture({ fil, blocs: aplatir(ENTREES_CHOIX), ctx: { heros: HEROS, persos: {} }, vitesse: () => 0 });
    lecture.avancer(); // bulle "Un"
    lecture.avancer(); // bulle "On y va ?"
    lecture.avancer(); // bloc choix
    return { fil, lecture };
  }
  it("bloque la lecture sur le bloc choix tant qu'aucune option n'est cliquée", () => {
    const { fil, lecture } = avancerAuChoix();
    const posApresChoix = lecture.position();
    expect(fil.querySelectorAll(".choix button.option")).toHaveLength(2);
    lecture.avancer(); // ne doit pas dépasser le choix
    expect(lecture.position()).toBe(posApresChoix);
    expect(fil.querySelectorAll(".bulle")).toHaveLength(2); // "Après" pas encore inséré
  });
  it("cliquer une option l'illumine, fane les autres, puis la lecture reprend", () => {
    const { fil, lecture } = avancerAuChoix();
    const boutons = [...fil.querySelectorAll(".choix button.option")];
    boutons[0].click();
    expect(boutons[0].classList.contains("elu")).toBe(true);
    expect(boutons[1].classList.contains("fane")).toBe(true);
    expect(boutons[0].classList.contains("fane")).toBe(false);
    expect(boutons[1].classList.contains("elu")).toBe(false);
    // la lecture a repris : la bulle "Après" est insérée
    expect(fil.querySelectorAll(".bulle")).toHaveLength(3);
    expect(fil.textContent).toContain("Après");
  });
  it("toutDerouler ne reste pas bloqué sur un choix", () => {
    const fil = document.createElement("div");
    const lecture = creerLecture({ fil, blocs: aplatir(ENTREES_CHOIX), ctx: { heros: HEROS, persos: {} }, vitesse: () => 0 });
    lecture.avancer();
    lecture.avancer();
    lecture.avancer(); // bloc choix, arme choixEnAttente
    lecture.toutDerouler();
    expect(lecture.position()).toBe(aplatir(ENTREES_CHOIX).length);
    expect(fil.querySelectorAll(".bulle")).toHaveLength(3);
  });
  it("rejouerJusque traverse un choix sans rester bloqué (reprise de lecture)", () => {
    const fil = document.createElement("div");
    const blocs = aplatir(ENTREES_CHOIX);   // [bulle, bulle, choix, bulle] → length 4
    const lecture = creerLecture({ fil, blocs, ctx: { heros: HEROS, persos: {} }, vitesse: () => 0 });
    lecture.rejouerJusque(blocs.length);    // simule une reprise au-delà du choix
    expect(lecture.position()).toBe(blocs.length);
    expect(fil.querySelectorAll(".bulle")).toHaveLength(3);
    // et la lecture reste utilisable ensuite (pas de choixEnAttente résiduel)
    lecture.avancer();
    expect(lecture.position()).toBe(blocs.length);
  });
});

describe("ecrireMachine — robustesse hors-BMP (T13 fix)", () => {
  it("ne tape pas le bouton .swap (emoji surrogate) ni la version EN cachée", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    el.innerHTML =
      '<div class="contenu"><span class="fr">abc</span>' +
      '<div class="version-en">EN</div><button class="swap">🔁</button></div>';
    ecrireMachine(el, 10);
    // l'emoji du bouton reste intact dès le premier tick, jamais un demi-surrogate
    expect(el.querySelector(".swap").textContent).toBe("🔁");
    expect(el.querySelector(".version-en").textContent).toBe("EN");
    vi.advanceTimersByTime(100);
    expect(el.querySelector(".fr").textContent).toBe("abc");
    expect(el.querySelector(".swap").textContent).toBe("🔁");
    vi.useRealTimers();
  });
  it("découpe un caractère hors-BMP par point de code, jamais de demi-surrogate", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    el.innerHTML = '<div class="fr">a😀b</div>';
    ecrireMachine(el, 10);
    expect(el.textContent).toBe("a");
    vi.advanceTimersByTime(10);
    expect(el.textContent).toBe("a😀");   // l'emoji apparaît d'un seul bloc
    vi.advanceTimersByTime(10);
    expect(el.textContent).toBe("a😀b");
    vi.useRealTimers();
  });
});

describe("construireBulle — comparaison FR/EN (T15)", () => {
  it("avec bulles_en : .version-en contient le texte EN, .swap toggle montre-en", () => {
    const el = construireBulle(E_AVEC_EN, E_AVEC_EN.bulles_fr[0], { heros: HEROS, persos: PERSOS });
    const versionEn = el.querySelector(".version-en");
    expect(versionEn).not.toBeNull();
    expect(versionEn.textContent).toBe("Yo.");
    const swap = el.querySelector(".swap");
    expect(swap).not.toBeNull();
    expect(el.classList.contains("montre-en")).toBe(false);
    swap.onclick({ stopPropagation: () => {} });
    expect(el.classList.contains("montre-en")).toBe(true);
    swap.onclick({ stopPropagation: () => {} });
    expect(el.classList.contains("montre-en")).toBe(false);
  });
  it("sans bulles_en : ne plante pas, .version-en présent mais vide", () => {
    const el = construireBulle(E_SANS_EN, E_SANS_EN.bulles_fr[0], { heros: HEROS, persos: PERSOS });
    const versionEn = el.querySelector(".version-en");
    expect(versionEn).not.toBeNull();
    expect(versionEn.textContent).toBe("");
  });
});

describe("construireChoix — comparaison FR/EN (T15)", () => {
  it("avec choix_en : boutons ont le title EN et une ligne .version-en jointe par « / »", () => {
    const bloc = construireChoix(E_MENU_EN);
    const boutons = [...bloc.querySelectorAll("button.option")];
    expect(boutons.map(b => b.title)).toEqual(["Yes", "No"]);
    const versionEn = bloc.querySelector(".version-en");
    expect(versionEn).not.toBeNull();
    expect(versionEn.textContent).toBe("Yes / No");
  });
  it("sans choix_en : pas de title, pas de .version-en", () => {
    const bloc = construireChoix(E_MENU);
    const boutons = [...bloc.querySelectorAll("button.option")];
    expect(boutons.every(b => b.title === "")).toBe(true);
    expect(bloc.querySelector(".version-en")).toBeNull();
  });
  it("affiche l'avatar du héros et un en-tête « votre réponse » (côté droit)", () => {
    const bloc = construireChoix(E_MENU, { heros: { prenom: "Hamza" } });
    const entete = bloc.querySelector(".choix-entete");
    expect(entete).not.toBeNull();
    expect(entete.querySelector(".choix-titre").textContent).toContain("Hamza");
    expect(entete.querySelector(".avatar")).not.toBeNull();
  });
});

describe("construireChoix — édition des réponses", () => {
  const E_MENU_BRUT = { id: 6, nom_fr: "Mme Saeko", budget: 200,
    bulles_fr: [{ nom: null, seg: [{ t: "On y va ?" }] }],
    choix_fr: { question: [{ t: "On y va ?" }], options: ["Oui", "Non"] },
    brut_fr: "On y va ?\n[1208][0002]Oui\nNon" };

  it("expose un bouton ✏️ distinct des options, qui appelle surEditerChoix", () => {
    const bloc = construireChoix(E_MENU_BRUT, { heros: { prenom: "Hamza" } });
    const boutons = [...bloc.querySelectorAll("button")];
    expect(boutons).toHaveLength(3);   // 2 options + 1 édition
    expect(bloc.querySelectorAll("button.option")).toHaveLength(2);
    const btnEdit = bloc.querySelector("button.edit");
    expect(btnEdit).not.toBeNull();

    let appelee = null;
    const bloc2 = construireChoix(E_MENU_BRUT, {
      heros: { prenom: "Hamza" },
      surEditerChoix: (entree, el) => { appelee = { entree, el }; },
    });
    bloc2.querySelector("button.edit").onclick({ stopPropagation: () => {} });
    expect(appelee.entree).toBe(E_MENU_BRUT);
    expect(appelee.el).toBe(bloc2);
  });

  it("le bouton édition n'est pas armé comme une option par armerChoix (creerLecture)", () => {
    const fil = document.createElement("div");
    const blocs = [{ type: "choix", entree: E_MENU_BRUT }];
    const lecture = creerLecture({ fil, blocs, ctx: { heros: { prenom: "Hamza" } }, vitesse: () => 0 });
    lecture.avancer();
    const btnEdit = fil.querySelector("button.edit");
    // toujours son propre onclick (pas remplacé par la logique d'armement des options)
    expect(btnEdit.onclick).not.toBeNull();
    btnEdit.click();
    expect(btnEdit.classList.contains("elu")).toBe(false);
    expect(btnEdit.classList.contains("fane")).toBe(false);
  });
});
