import { describe, it, expect, beforeEach } from "vitest";
import { initTheme, basculerTheme, appliquerTheme } from "../js/theme.js";
import { Etat } from "../js/etat.js";

beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = ""; });

describe("theme", () => {
  it("init applique le thème par défaut rouge (Innocent Sin)", () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("rouge");
  });
  it("bascule rouge <-> nuit et persiste", () => {
    initTheme();
    basculerTheme();
    expect(document.documentElement.dataset.theme).toBe("nuit");
    expect(Etat.get("theme", "")).toBe("nuit");
  });
  it("init relit le thème persisté", () => {
    appliquerTheme("nuit");
    document.documentElement.dataset.theme = "";
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
});
