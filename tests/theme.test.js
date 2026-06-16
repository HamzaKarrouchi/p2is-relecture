import { describe, it, expect, beforeEach } from "vitest";
import { initTheme, basculerTheme, appliquerTheme } from "../js/theme.js";
import { Etat } from "../js/etat.js";

beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = ""; });

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
