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
  it("ne marque pas un terme qui n'est qu'une sous-chaîne d'un autre mot", () => {
    const d = [{ en: "Shadow", fr: "Ombre" }];
    const el = document.createElement("span");
    el.textContent = "Il fait sombre dans la Ombre.";
    marquerTermes(el, d);
    // « sombre » ne doit jamais matcher (Ombre précédé d'une lettre) ;
    // seule la véritable occurrence isolée « Ombre » est marquée.
    const marques = [...el.querySelectorAll(".mot-dico")];
    expect(marques).toHaveLength(1);
    expect(marques[0].textContent).toBe("Ombre");
  });
  it("priorise le terme le plus long en cas de chevauchement", () => {
    const d = [{ en: "Circle", fr: "Cercle" }, { en: "Masked circle", fr: "Cercle masqué" }];
    const el = document.createElement("span");
    el.textContent = "Le Cercle masqué approche.";
    marquerTermes(el, d);
    const marques = [...el.querySelectorAll(".mot-dico")];
    expect(marques).toHaveLength(1);
    expect(marques[0].textContent).toBe("Cercle masqué");
  });
  it("ne marque qu'une seule occurrence par nœud texte", () => {
    const el = document.createElement("span");
    el.textContent = "Cercle masqué contre Cercle masqué, seconde manche.";
    marquerTermes(el, dico);
    expect(el.querySelectorAll(".mot-dico")).toHaveLength(1);
  });
  it("ignore les termes FR de 2 caractères ou moins", () => {
    const d = [{ en: "It", fr: "Ça" }];
    const el = document.createElement("span");
    el.textContent = "Ça alors !";
    marquerTermes(el, d);
    expect(el.querySelector(".mot-dico")).toBeNull();
  });
  it("ne re-marque pas un texte déjà à l'intérieur d'un .mot-dico", () => {
    const el = document.createElement("span");
    el.innerHTML = '<span class="mot-dico">Cercle masqué</span>';
    marquerTermes(el, dico);
    expect(el.querySelectorAll(".mot-dico")).toHaveLength(1);
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
  it("remplace [SP] par un espace avant de chercher (texte brut du jeu)", () => {
    expect(incoherences("The[SP]Last[SP]Battalion[SP]is[SP]here", "L'armée[SP]est[SP]là", dico))
      .toEqual(["Last Battalion → Bataillon"]);
  });
  it("insensible à la casse des deux côtés", () => {
    expect(incoherences("THE LAST BATTALION", "le bataillon", dico)).toEqual([]);
    expect(incoherences("THE LAST BATTALION", "l'armée", dico)).toEqual(["Last Battalion → Bataillon"]);
  });
  it("cumule plusieurs incohérences simultanées", () => {
    expect(incoherences("The Masked circle and the Last Battalion", "Le groupe et l'armée", dico))
      .toEqual(["Masked circle → Cercle masqué", "Last Battalion → Bataillon"]);
  });
  it("dico vide ou terme absent des deux textes → rien", () => {
    expect(incoherences("Hello", "Bonjour", [])).toEqual([]);
    expect(incoherences("Hello world", "Bonjour le monde", dico)).toEqual([]);
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
