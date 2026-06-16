import { describe, it, expect } from "vitest";
import { marquerTermes, incoherences } from "../js/dico.js";
import { lignesFiltrees, construireLigne } from "../js/dictionnaire.js";

const dico = [{ en: "Masked circle", fr: "Cercle masqué" },
              { en: "Last Battalion", fr: "Bataillon" }];

describe("marquerTermes", () => {
  it("entoure les termes FR connus", () => {
    const el = document.createElement("span");
    el.textContent = "Le Cercle masqué arrive.";
    marquerTermes(el, dico);
    const m = el.querySelector(".mot-dico");
    expect(m.textContent).toBe("Cercle masqué");
    expect(m.dataset.en).toBe("Masked circle");
  });
  it("ne touche pas les autres mots", () => {
    const el = document.createElement("span");
    el.textContent = "Bonjour le monde";
    marquerTermes(el, dico);
    expect(el.querySelector(".mot-dico")).toBeNull();
  });
});

describe("incoherences", () => {
  it("signale un terme EN sans sa traduction validée en FR", () => {
    expect(incoherences("The Last Battalion is here", "L'armée est là", dico))
      .toEqual(["Last Battalion → Bataillon"]);
  });
  it("rien si la traduction validée est utilisée", () => {
    expect(incoherences("The Last Battalion", "Le Bataillon", dico)).toEqual([]);
  });
  it("gère les variantes « a/b » des deux côtés", () => {
    const d = [{ en: "Shadow/Shadowmen", fr: "Ombre" },
               { en: "Grand Cross", fr: "Croix Cosmique/Croix" }];
    // EN à variantes : « Shadowmen » seul doit déclencher la détection
    expect(incoherences("The Shadowmen attack", "Les monstres", d))
      .toEqual(["Shadow/Shadowmen → Ombre"]);
    // FR à variantes : la forme courte validée « Croix » ne doit PAS être un faux positif
    expect(incoherences("The Grand Cross", "La Croix brille", d)).toEqual([]);
    // EN à variantes correctement traduit → rien
    expect(incoherences("A Shadow appears", "Une Ombre apparaît", d)).toEqual([]);
  });
});

describe("lignesFiltrees", () => {
  it("filtre insensible à la casse sur EN et FR", () => {
    expect(lignesFiltrees(dico, "bataillon")).toEqual([dico[1]]);
    expect(lignesFiltrees(dico, "MASKED")).toEqual([dico[0]]);
  });
  it("renvoie tout si la recherche est vide", () => {
    expect(lignesFiltrees(dico, "")).toEqual(dico);
  });
});

describe("construireLigne", () => {
  it("crée une ligne avec EN et FR en textContent", () => {
    const tr = construireLigne(dico[0]);
    expect(tr.querySelector(".en").textContent).toBe("Masked circle");
    expect(tr.querySelector(".fr").textContent).toBe("Cercle masqué");
  });
});
