import { describe, it, expect, vi, beforeEach } from "vitest";
import { dureeRevele, construireRevele } from "../js/reveal.js";

beforeEach(() => { document.body.innerHTML = ""; });

describe("dureeRevele", () => {
  it("≈2200ms en mouvement normal", () => expect(dureeRevele(false)).toBe(2200));
  it("0ms si reduced-motion", () => expect(dureeRevele(true)).toBe(0));
});

describe("construireRevele", () => {
  it("insère un overlay #revele avec le portrait et le nom (textContent)", () => {
    construireRevele({ prenom: "Maya", nom: "Amano", portrait: "img/portraits/Tatsuya.webp" });
    const ov = document.getElementById("revele");
    expect(ov).toBeTruthy();
    expect(ov.querySelector("img").getAttribute("src")).toBe("img/portraits/Tatsuya.webp");
    expect(ov.querySelector(".nom-revele").textContent).toBe("Maya Amano");
  });
  it("échappe le nom (pas d'injection HTML)", () => {
    construireRevele({ prenom: "<b>x</b>", nom: "", portrait: "img/portraits/Tatsuya.webp" });
    const nom = document.querySelector("#revele .nom-revele");
    expect(nom.querySelector("b")).toBeNull();
    expect(nom.textContent).toContain("<b>x</b>");
  });
});
