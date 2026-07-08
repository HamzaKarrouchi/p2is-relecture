import { cost, caracteresInterdits } from "./budget.js";
import { texteLisible } from "./normalise.js";

// ⚠ hex minuscules AUSSI (cohérence avec sync.py/_PAUSE et normalise.js corrigés)
const RE_JETON = /\[1205\](?:\[(?:U\+000[0-9A-Fa-f]|001E)\])?|\n|\[[^\]]*\]/g;

// Miroir de sync.py:_MENU — marque le début de la partie « réponses » d'une
// entrée à choix. Tout ce qui précède (la question) reste gelé à l'édition.
const RE_DEBUT_MENU = /\[(?:U\+)?1208\](?:\[(?:U\+)?[0-9A-Fa-f]{4}\])?/;

export function trouverDebutMenu(brut) {
  const m = RE_DEBUT_MENU.exec(brut);
  return m ? m.index : -1;
}

export function icone(code) {
  if (code.startsWith("[1205]")) return "⏸";
  if (code === "\n") return "⏎";
  if (code === "[1113]") return "👤p";
  if (code === "[1112]") return "👤n";
  if (code === "[1432]" || code === "[0014]") return "🔲";
  return "⟨" + code.slice(1, -1) + "⟩";
}

export function brutVersJetons(brut) {
  const jetons = []; let i = 0;
  for (const m of brut.matchAll(RE_JETON)) {
    if (m.index > i) jetons.push({ type: "texte", v: brut.slice(i, m.index) });
    jetons.push({ type: "code", v: m[0], icone: icone(m[0]) });
    i = m.index + m[0].length;
  }
  if (i < brut.length) jetons.push({ type: "texte", v: brut.slice(i) });
  return jetons;
}

export function jetonsVersBrut(jetons) {
  return jetons.map(j => j.v).join("");
}

/**
 * Ouvre le panneau d'édition à jetons pour une entrée donnée.
 * @param entree     {id, nom_fr, brut_fr, brut_en, budget, ...}
 * @param surValide  callback({brut_fr, nom_fr, cout}) appelé à la validation
 */
export function ouvrirEditeur(entree, surValide) {
  const pan = document.getElementById("panneau-editeur");
  if (!pan) return;
  pan.hidden = false;
  pan.innerHTML = `
    <div class="ed-tete"><b>Script — id <span id="ed-id"></span></b>
      <button class="ed-fermer">✕</button></div>
    <div class="ed-en"></div>
    <label class="ed-nom">Nom : <input id="ed-nom" value=""></label>
    <div id="ed-zone" contenteditable="true" spellcheck="true"></div>
    <div class="ed-outils">
      <button data-ins="\n">⏎ saut</button>
      <button data-ins="[1205][U+000F]">⏸ pause</button>
      <span id="ed-jauge"></span>
    </div>
    <div id="ed-erreurs"></div>
    <button id="ed-valider" disabled>Proposer cette modification</button>`;
  pan.querySelector("#ed-id").textContent = entree.id;
  pan.querySelector(".ed-en").textContent = (entree.brut_en || "").replace(/\[SP\]/g, " ");
  const zone = pan.querySelector("#ed-zone");
  const nomInput = pan.querySelector("#ed-nom");
  nomInput.value = entree.nom_fr;

  function poserJetons(jetons) {
    zone.replaceChildren();
    for (const j of jetons) {
      if (j.type === "texte") zone.append(j.v);
      else {
        const el = document.createElement("span");
        el.className = "jeton"; el.contentEditable = "false";
        el.textContent = j.icone; el.dataset.code = j.v;
        zone.append(el);
      }
    }
  }
  function lireJetons() {
    const jetons = [];
    for (const n of zone.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) jetons.push({ type: "texte", v: n.textContent });
      else if (n.dataset?.code !== undefined) jetons.push({ type: "code", v: n.dataset.code });
      else jetons.push({ type: "texte", v: n.textContent });   // collages -> texte
    }
    return jetons;
  }
  function maj() {
    const brut = jetonsVersBrut(lireJetons());
    const c = cost(nomInput.value, brut), b = entree.budget;
    const interdits = caracteresInterdits(brut + nomInput.value);
    const jauge = pan.querySelector("#ed-jauge");
    jauge.textContent = `${c} / ${b} octets`;
    jauge.className = c > b ? "rouge" : c > b * 0.92 ? "orange" : "vert";
    pan.querySelector("#ed-erreurs").textContent = interdits.length
      ? `Caractères non supportés par le jeu : ${interdits.join(" ")}` : "";
    pan.querySelector("#ed-valider").disabled = c === -1 || c > b || interdits.length > 0;
    return brut;
  }
  zone.addEventListener("input", maj);
  nomInput.addEventListener("input", maj);
  for (const btn of pan.querySelectorAll("[data-ins]"))
    btn.onclick = () => {
      document.execCommand("insertHTML", false,
        `<span class="jeton" contenteditable="false" data-code="${btn.dataset.ins === "\n" ? "&#10;" : btn.dataset.ins}">${icone(btn.dataset.ins)}</span>`);
      maj();
    };
  pan.querySelector(".ed-fermer").onclick = () => { pan.hidden = true; };
  pan.querySelector("#ed-valider").onclick = () => {
    const brut = maj();
    surValide({ brut_fr: brut, nom_fr: nomInput.value, cout: cost(nomInput.value, brut) });
    pan.hidden = true;
  };
  poserJetons(brutVersJetons(entree.brut_fr));
  maj();
}

/**
 * Ouvre l'éditeur à jetons limité aux réponses d'un bloc à choix : la question
 * (tout ce qui précède le marqueur [1208]) reste gelée, seules les options
 * sont éditables. Permet de proposer de nouvelles réponses sans risquer de
 * casser la structure du menu (marqueurs [1432]/[NULL]/[0014] intacts, comme
 * pour l'éditeur de bulle : seuls les segments de texte libre changent).
 * @param entree     {id, nom_fr, brut_fr, budget, choix_en, ...}
 * @param surValide  callback({brut_fr, nom_fr, cout}) appelé à la validation
 */
export function ouvrirEditeurChoix(entree, surValide) {
  const pan = document.getElementById("panneau-editeur");
  if (!pan) return;
  const debut = trouverDebutMenu(entree.brut_fr);
  const prefixe = debut >= 0 ? entree.brut_fr.slice(0, debut) : "";
  const suffixeInit = debut >= 0 ? entree.brut_fr.slice(debut) : entree.brut_fr;
  pan.hidden = false;
  pan.innerHTML = `
    <div class="ed-tete"><b>Réponses — id <span id="ed-id"></span></b>
      <button class="ed-fermer">✕</button></div>
    <div class="ed-question-gelee"></div>
    <div class="ed-en"></div>
    <div id="ed-zone" contenteditable="true" spellcheck="true"></div>
    <div class="ed-outils">
      <button data-ins="\n">⏎ saut</button>
      <button data-ins="[1205][U+000F]">⏸ pause</button>
      <span id="ed-jauge"></span>
    </div>
    <div id="ed-erreurs"></div>
    <button id="ed-valider" disabled>Proposer cette modification</button>`;
  pan.querySelector("#ed-id").textContent = entree.id;
  // textContent uniquement — prefixe/options viennent de la trad :
  pan.querySelector(".ed-question-gelee").textContent =
    "Question (non modifiable) : " + texteLisible(prefixe);
  pan.querySelector(".ed-en").textContent = (entree.choix_en?.options || []).join(" / ");
  const zone = pan.querySelector("#ed-zone");

  function poserJetons(jetons) {
    zone.replaceChildren();
    for (const j of jetons) {
      if (j.type === "texte") zone.append(j.v);
      else {
        const el = document.createElement("span");
        el.className = "jeton"; el.contentEditable = "false";
        el.textContent = j.icone; el.dataset.code = j.v;
        zone.append(el);
      }
    }
  }
  function lireJetons() {
    const jetons = [];
    for (const n of zone.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) jetons.push({ type: "texte", v: n.textContent });
      else if (n.dataset?.code !== undefined) jetons.push({ type: "code", v: n.dataset.code });
      else jetons.push({ type: "texte", v: n.textContent });   // collages -> texte
    }
    return jetons;
  }
  function maj() {
    const suffixe = jetonsVersBrut(lireJetons());
    const brut = prefixe + suffixe;
    const c = cost(entree.nom_fr, brut), b = entree.budget;
    const interdits = caracteresInterdits(brut);
    const jauge = pan.querySelector("#ed-jauge");
    jauge.textContent = `${c} / ${b} octets`;
    jauge.className = c > b ? "rouge" : c > b * 0.92 ? "orange" : "vert";
    pan.querySelector("#ed-erreurs").textContent = interdits.length
      ? `Caractères non supportés par le jeu : ${interdits.join(" ")}` : "";
    pan.querySelector("#ed-valider").disabled = c === -1 || c > b || interdits.length > 0;
    return brut;
  }
  zone.addEventListener("input", maj);
  for (const btn of pan.querySelectorAll("[data-ins]"))
    btn.onclick = () => {
      document.execCommand("insertHTML", false,
        `<span class="jeton" contenteditable="false" data-code="${btn.dataset.ins === "\n" ? "&#10;" : btn.dataset.ins}">${icone(btn.dataset.ins)}</span>`);
      maj();
    };
  pan.querySelector(".ed-fermer").onclick = () => { pan.hidden = true; };
  pan.querySelector("#ed-valider").onclick = () => {
    const brut = maj();
    surValide({ brut_fr: brut, nom_fr: entree.nom_fr, cout: cost(entree.nom_fr, brut) });
    pan.hidden = true;
  };
  poserJetons(brutVersJetons(suffixeInit));
  maj();
}
