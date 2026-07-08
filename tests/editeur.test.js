import { describe, it, expect, beforeEach } from "vitest";
import { brutVersJetons, jetonsVersBrut, trouverDebutMenu, ouvrirEditeurChoix } from "../js/editeur.js";

describe("aller-retour brut ↔ jetons", () => {
  const cas = [
    "Bonjour.",
    "Oui.[1205][U+000F] Non.\nFin",
    "Salut [1113] [1112] !",
    "[1432][NULL][NULL][0014]Armes[1432][NULL][NULL][0014] ici",
    "a[E1][E2][U+0159]b",
  ];
  for (const brut of cas) {
    it(`préserve « ${brut.slice(0, 30)} »`, () => {
      expect(jetonsVersBrut(brutVersJetons(brut))).toBe(brut);
    });
  }
  it("découpe en jetons typés", () => {
    const j = brutVersJetons("Oui.[1205][U+000F]\nNon");
    expect(j).toEqual([
      { type: "texte", v: "Oui." },
      { type: "code", v: "[1205][U+000F]", icone: "⏸" },
      { type: "code", v: "\n", icone: "⏎" },
      { type: "texte", v: "Non" },
    ]);
  });
});

describe("trouverDebutMenu", () => {
  it("-1 si pas de menu", () => {
    expect(trouverDebutMenu("Bonjour.")).toBe(-1);
  });
  it("localise [1208] (type simple)", () => {
    expect(trouverDebutMenu("On y va ?\n[1208][0002]Oui\nNon")).toBe(10);
  });
  it("accepte le préfixe U+", () => {
    const brut = "Quoi ?\n[U+1208][U+0003][111F]Bavarder";
    expect(trouverDebutMenu(brut)).toBe(brut.indexOf("[U+1208]"));
  });
});

describe("ouvrirEditeurChoix", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="panneau-editeur" hidden></div>';
  });

  const ENTREE = {
    id: 3, nom_fr: "Mme Saeko", budget: 999,
    brut_fr: "On y va ?\n[1208][0002]Oui\nNon",
    choix_en: { options: ["Yes", "No"] },
  };

  it("gèle la question (texte + textContent, jamais innerHTML) et affiche les options EN", () => {
    ouvrirEditeurChoix(ENTREE, () => {});
    expect(document.querySelector(".ed-question-gelee").textContent)
      .toBe("Question (non modifiable) : On y va ?⏎");
    expect(document.querySelector(".ed-en").textContent).toBe("Yes / No");
    const zone = document.querySelector("#ed-zone");
    expect(zone.textContent).toBe("⟨1208⟩⟨0002⟩Oui⏎Non");
  });

  it("édite une réponse sans toucher à la question, propose la modification", () => {
    let proposition = null;
    ouvrirEditeurChoix(ENTREE, (prop) => { proposition = prop; });
    const zone = document.querySelector("#ed-zone");
    const texteOui = [...zone.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent === "Oui");
    texteOui.textContent = "Ouais";
    zone.dispatchEvent(new Event("input"));
    expect(document.querySelector("#ed-valider").disabled).toBe(false);
    document.querySelector("#ed-valider").click();
    expect(proposition.brut_fr).toBe("On y va ?\n[1208][0002]Ouais\nNon");
    expect(proposition.nom_fr).toBe("Mme Saeko");
    expect(document.getElementById("panneau-editeur").hidden).toBe(true);
  });

  it("bloque la validation si le budget est dépassé", () => {
    ouvrirEditeurChoix({ ...ENTREE, budget: 1 }, () => {});
    expect(document.querySelector("#ed-valider").disabled).toBe(true);
  });
});
