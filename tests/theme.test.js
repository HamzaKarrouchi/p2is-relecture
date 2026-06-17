import { describe, it, expect, beforeEach } from "vitest";
import { initTheme, basculerTheme, appliquerTheme, choisirThemeInitial } from "../js/theme.js";
import { Etat } from "../js/etat.js";

beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = ""; });

describe("choisirThemeInitial", () => {
  it("garde la préférence stockée si valide", () => {
    expect(choisirThemeInitial("jour", false)).toBe("jour");
    expect(choisirThemeInitial("nuit", true)).toBe("nuit");
  });
  it("sans préférence : suit prefers-color-scheme (clair → jour, sombre → nuit)", () => {
    expect(choisirThemeInitial(null, true)).toBe("jour");
    expect(choisirThemeInitial(null, false)).toBe("nuit");
  });
  it("une valeur stockée invalide retombe sur le système", () => {
    expect(choisirThemeInitial("xxx", true)).toBe("jour");
    expect(choisirThemeInitial("xxx", false)).toBe("nuit");
  });
});

describe("theme", () => {
  it("init applique le thème par défaut nuit (Velvet)", () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
  it("bascule nuit <-> jour et persiste", () => {
    initTheme();
    basculerTheme();
    expect(document.documentElement.dataset.theme).toBe("jour");
    expect(Etat.get("theme", "")).toBe("jour");
  });
  it("init relit le thème persisté", () => {
    appliquerTheme("jour");
    document.documentElement.dataset.theme = "";
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("jour");
  });
  it("rejette une valeur inconnue en retombant sur nuit", () => {
    appliquerTheme("xxx");
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
});
