import { describe, it, expect, beforeEach } from "vitest";
import { toast } from "../js/toast.js";

beforeEach(() => { document.body.innerHTML = ""; });

describe("toast", () => {
  it("crée une zone et un message via textContent", () => {
    toast("Sauvegarde importée");
    const t = document.querySelector("#zone-toast .toast");
    expect(t).toBeTruthy();
    expect(t.textContent).toBe("Sauvegarde importée");
    expect(t.classList.contains("erreur")).toBe(false);
  });
  it("supporte le type erreur", () => {
    toast("Fichier invalide", { erreur: true });
    expect(document.querySelector(".toast.erreur")).toBeTruthy();
  });
  it("réutilise la même zone", () => {
    toast("a"); toast("b");
    expect(document.querySelectorAll("#zone-toast").length).toBe(1);
    expect(document.querySelectorAll(".toast").length).toBe(2);
  });
});
