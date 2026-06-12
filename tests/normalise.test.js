import { describe, it, expect } from "vitest";
import { rendreSegments, texteLisible, rendreAvatar } from "../js/normalise.js";

const heros = { prenom: "Hamza", nom: "Karrouchi" };

describe("rendreSegments", () => {
  it("texte simple", () => {
    const el = rendreSegments([{ t: "Bonjour" }], heros);
    expect(el.textContent).toBe("Bonjour");
  });
  it("héros remplacé et marqué", () => {
    const el = rendreSegments([{ t: "Salut " }, { hero: "prenom" }], heros);
    expect(el.textContent).toBe("Salut Hamza");
    expect(el.querySelector(".placeholder-heros")).toBeTruthy();
  });
  it("pause, saut, encadré, surligné", () => {
    const el = rendreSegments(
      [{ t: "a" }, { pause: true }, { nl: true }, { enc: "Armes" }, { hl: "fort" }], heros);
    expect(el.querySelector(".pause")).toBeTruthy();
    expect(el.querySelector("br")).toBeTruthy();
    expect(el.querySelector(".enc").textContent).toBe("Armes");
    expect(el.querySelector(".hl").textContent).toBe("fort");
  });
  it("héros nom remplacé et marqué", () => {
    const el = rendreSegments([{ hero: "nom" }], heros);
    expect(el.textContent).toBe("Karrouchi");
    const span = el.querySelector(".placeholder-heros");
    expect(span).toBeTruthy();
    expect(span.title).toContain("[1112]");
  });
  it("title de prenom contient [1113]", () => {
    const el = rendreSegments([{ hero: "prenom" }], heros);
    expect(el.querySelector(".placeholder-heros").title).toContain("[1113]");
  });
  it("liste vide retourne un span vide", () => {
    const el = rendreSegments([], heros);
    expect(el.tagName.toLowerCase()).toBe("span");
    expect(el.textContent).toBe("");
  });
});

describe("texteLisible (pour l'export Discord)", () => {
  it("symbolise pauses et sauts", () => {
    expect(texteLisible("Oui.[1205][U+000F] Non.\nFin"))
      .toBe("Oui.⏸ Non.⏎Fin");
  });
  it("convertit [SP] en espace", () => {
    expect(texteLisible("a[SP]b")).toBe("a b");
  });
  it("pause seule sans suffixe", () => {
    expect(texteLisible("[1205]suite")).toBe("⏸suite");
  });
  it("pause avec [001E]", () => {
    expect(texteLisible("Texte[1205][001E]fin")).toBe("Texte⏸fin");
  });
  it("texte sans codes inchangé", () => {
    expect(texteLisible("Hello world")).toBe("Hello world");
  });
});

describe("rendreAvatar", () => {
  it("portrait → <img> avec src correct", () => {
    const av = rendreAvatar("Maya", { portrait: "maya.webp", emoji: "🌸" });
    const img = av.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.src).toContain("img/portraits/maya.webp");
  });
  it("pas de portrait → emoji en textContent", () => {
    const av = rendreAvatar("Eikichi", { emoji: "🎸" });
    expect(av.querySelector("img")).toBeFalsy();
    expect(av.textContent).toBe("🎸");
  });
  it("ni portrait ni emoji → initiale majuscule du nom", () => {
    const av = rendreAvatar("tatsuya", {});
    expect(av.querySelector("img")).toBeFalsy();
    expect(av.textContent).toBe("T");
  });
  it("nom vide → '?'", () => {
    const av = rendreAvatar("", {});
    expect(av.textContent).toBe("?");
  });
  it("perso null → initiale majuscule", () => {
    const av = rendreAvatar("Jun", null);
    expect(av.textContent).toBe("J");
  });
  it("perso null + nom vide → '?'", () => {
    const av = rendreAvatar("", null);
    expect(av.textContent).toBe("?");
  });
  it("avatar a la classe 'avatar'", () => {
    const av = rendreAvatar("Maya", { portrait: "maya.webp" });
    expect(av.className).toBe("avatar");
  });
});
