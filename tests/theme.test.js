import { describe, it, expect, beforeEach } from "vitest";
import { initTheme, basculerTheme, appliquerTheme } from "../js/theme.js";
import { Etat } from "../js/etat.js";

beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = ""; });

describe("theme", () => {
  it("init applique le thème par défaut nuit", () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
  it("bascule nuit <-> rouge et persiste", () => {
    initTheme();
    basculerTheme();
    expect(document.documentElement.dataset.theme).toBe("rouge");
    expect(Etat.get("theme", "")).toBe("rouge");
  });
  it("init relit le thème persisté", () => {
    appliquerTheme("rouge");
    document.documentElement.dataset.theme = "";
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("rouge");
  });
});
