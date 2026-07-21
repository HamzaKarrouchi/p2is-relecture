import { Etat } from "./etat.js";
import { texteLisible } from "./normalise.js";

export function formaterExport(props, { pseudo, budgets }) {
  const parScript = new Map();
  for (const p of props) {
    if (!parScript.has(p.script)) parScript.set(p.script, []);
    parScript.get(p.script).push(p);
  }
  const lignes = [`📋 Propositions de ${pseudo || "?"} — P2IS Relecture`];
  for (const [no, liste] of [...parScript].sort((a, b) => a[0] - b[0])) {
    lignes.push("", `**Script ${String(no).padStart(3, "0")}**`);
    for (const p of liste.sort((a, b) => a.id - b.id)) {
      const budget = budgets[`${no}/${p.id}`] ?? "?";
      lignes.push(`• id ${p.id} (${p.cout}/${budget} o)`);
      if (p.ancien_nom !== p.nom_fr) lignes.push(`  nom : ${p.ancien_nom} → ${p.nom_fr}`);
      lignes.push(`  ancien : ${texteLisible(p.ancien_brut)}`);
      lignes.push(`  proposé : ${texteLisible(p.brut_fr)}`);
      lignes.push("  brut : `" + p.brut_fr.replace(/\n/g, "\\n").replace(/`/g, "'") + "`");
    }
  }
  return lignes.join("\n");
}

// Dépôt cible des issues créées depuis le panier : le fork de trad réellement
// lu par sync.py (../../Trad_Persona2/P2-FR-IS-PSP), pas le site p2is-relecture.
const DEPOT_ISSUES = { owner: "HamzaKarrouchi", repo: "P2-FR-IS-PSP" };
const LABELS_ISSUES = ["relecture"];
// Marge sous la limite pratique des navigateurs/GitHub pour une URL issues/new
// (~8000 caractères) : au-delà, un panier volumineux est scindé en plusieurs issues.
const LIMITE_URL = 7500;

export function construireLienIssue({ owner, repo } = DEPOT_ISSUES, titre, corps, labels = LABELS_ISSUES) {
  const q = [`title=${encodeURIComponent(titre)}`, `body=${encodeURIComponent(corps)}`];
  if (labels.length) q.push(`labels=${encodeURIComponent(labels.join(","))}`);
  return `https://github.com/${owner}/${repo}/issues/new?${q.join("&")}`;
}

/** Découpe les propositions en lots dont l'URL d'issue générée reste sous LIMITE_URL. */
export function decouperProps(props, opts) {
  const tries = [...props].sort((a, b) => a.script - b.script || a.id - b.id);
  const titrePlaceholder = `Propositions de ${opts.pseudo || "?"} — P2IS Relecture (9/9)`;
  const chunks = [];
  let courant = [];
  for (const p of tries) {
    const essai = [...courant, p];
    const url = construireLienIssue(DEPOT_ISSUES, titrePlaceholder, formaterExport(essai, opts));
    if (courant.length && url.length > LIMITE_URL) {
      chunks.push(courant);
      courant = [p];
    } else {
      courant = essai;
    }
  }
  if (courant.length) chunks.push(courant);
  return chunks;
}

/** -> [{titre, corps, url}] : un lien issues/new pré-rempli par lot. */
export function construireLiensIssues(props, opts) {
  const chunks = decouperProps(props, opts);
  return chunks.map((chunk, i) => {
    const suffixe = chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : "";
    const titre = `Propositions de ${opts.pseudo || "?"} — P2IS Relecture${suffixe}`;
    const corps = formaterExport(chunk, opts);
    return { titre, corps, url: construireLienIssue(DEPOT_ISSUES, titre, corps) };
  });
}

export function ouvrirPanier(budgets, majBadge) {
  const pan = document.getElementById("panneau-panier");
  if (!pan) return;
  pan.hidden = false;
  const props = Etat.panier();
  // Squelette en innerHTML STATIQUE (aucune donnée de trad interpolée) :
  pan.innerHTML = `<div class="ed-tete"><b>📋 Panier (<span id="pn-n"></span>)</b>
      <button class="ed-fermer">✕</button></div>
    <label>Pseudo : <input id="pn-pseudo"></label>
    <div id="pn-liste"></div>
    <button id="pn-issue">🐙 Créer une issue GitHub</button>
    <div id="pn-liens-secours" hidden></div>
    <button id="pn-copier">Copier (texte brut)</button>
    <textarea id="pn-secours" hidden rows="8"></textarea>
    <button id="pn-vider">Vider le panier</button>`;
  pan.querySelector("#pn-n").textContent = props.length;
  pan.querySelector("#pn-pseudo").value = Etat.get("pseudo", "");
  const liste = pan.querySelector("#pn-liste");
  for (const p of props) {
    const d = document.createElement("div"); d.className = "pn-item";
    // textContent / createElement — JAMAIS innerHTML avec brut_fr (données de trad) :
    const titre = document.createElement("b");
    titre.textContent = `${String(p.script).padStart(3, "0")}/${p.id}`;
    const apercu = document.createElement("span");
    apercu.textContent = " " + texteLisible(p.brut_fr).slice(0, 60) + "… ";
    const x = document.createElement("button"); x.textContent = "🗑"; x.dataset.x = "";
    x.onclick = () => { Etat.panierRetirer(p.script, p.id); ouvrirPanier(budgets, majBadge); majBadge?.(); };
    d.append(titre, apercu, x);
    liste.append(d);
  }
  pan.querySelector("#pn-pseudo").onchange = (ev) => Etat.set("pseudo", ev.target.value);
  pan.querySelector(".ed-fermer").onclick = () => { pan.hidden = true; };
  pan.querySelector("#pn-vider").onclick = () => { Etat.panierVider(); ouvrirPanier(budgets, majBadge); majBadge?.(); };
  pan.querySelector("#pn-copier").onclick = async () => {
    const txt = formaterExport(Etat.panier(), { pseudo: Etat.get("pseudo", ""), budgets });
    try { await navigator.clipboard.writeText(txt); pan.querySelector("#pn-copier").textContent = "Copié ✓"; }
    catch { const ta = pan.querySelector("#pn-secours"); ta.hidden = false; ta.value = txt; ta.select(); }
  };
  pan.querySelector("#pn-issue").onclick = () => {
    const liens = construireLiensIssues(Etat.panier(), { pseudo: Etat.get("pseudo", ""), budgets });
    const bloques = liens.filter(l => !window.open(l.url, "_blank", "noopener"));
    const secours = pan.querySelector("#pn-liens-secours");
    if (bloques.length) {
      secours.hidden = false;
      secours.replaceChildren();
      const info = document.createElement("p");
      info.textContent = "Pop-up bloquée — clique sur le(s) lien(s) :";
      secours.append(info);
      for (const l of bloques) {
        const a = document.createElement("a");
        a.href = l.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = l.titre;
        secours.append(a, document.createElement("br"));
      }
    } else {
      secours.hidden = true;
    }
  };
}
