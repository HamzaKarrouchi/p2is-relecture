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
    <button id="pn-copier">Copier pour Discord</button>
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
}
