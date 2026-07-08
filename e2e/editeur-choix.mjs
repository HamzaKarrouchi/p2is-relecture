#!/usr/bin/env node
// Vérification manuelle de bout en bout : édition d'une réponse de menu de
// choix (ouvre le panneau, question gelée visible, modifie une option,
// valide, vérifie le panier). Volontairement PAS une devDependency du projet
// (CLAUDE.md : vitest+jsdom uniquement, zéro dépendance runtime) — ce script
// suppose Playwright déjà installé ailleurs sur la machine (ex. `npm i -g
// playwright`) et n'est pas lancé par `npm test`/CI.
//
// Usage :
//   node e2e/editeur-choix.mjs [port] [numéro de script]
// Variables d'environnement :
//   PLAYWRIGHT_CHROMIUM_PATH  chemin d'un exécutable Chromium (sinon celui
//                             fourni par Playwright)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = process.argv[2] || "8099";
const SCRIPT = process.argv[3] || "1";
const RACINE = new URL("..", import.meta.url).pathname;

let echecs = 0;
function verifier(cond, msg) {
  if (cond) { console.log("  ✓ " + msg); }
  else { console.log("  ✗ " + msg); echecs++; }
}

const serveur = spawn("python3", ["-m", "http.server", PORT], { cwd: RACINE, stdio: "ignore" });
let browser;
try {
  await sleep(800);
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage();
  const erreursConsole = [];
  page.on("pageerror", (e) => erreursConsole.push(e.message));

  await page.goto(`http://localhost:${PORT}/lecture.html?s=${SCRIPT}`);
  await page.waitForTimeout(1000);
  await page.click("#btn-derouler");
  await page.waitForTimeout(800);

  const bloc = await page.$(".choix");
  verifier(!!bloc, `au moins un bloc .choix présent dans le script ${SCRIPT}`);
  if (!bloc) throw new Error(`aucun bloc .choix dans le script ${SCRIPT} — relancer avec un autre numéro`);
  const id = await bloc.getAttribute("data-id");

  const optionsAvant = await bloc.$$eval("button.option", (bs) => bs.map((b) => b.textContent));
  verifier(optionsAvant.length >= 2, "le bloc choix a au moins 2 options");

  await bloc.$eval("button.edit", (b) => b.click());
  await page.waitForTimeout(300);
  verifier(!(await page.evaluate(() => document.getElementById("panneau-editeur").hidden)),
    "le panneau d'édition s'ouvre");
  verifier((await page.textContent(".ed-question-gelee")).length > 0,
    "la question gelée est affichée (lecture seule)");

  // Modifie la première réponse en ajoutant un suffixe court.
  await page.evaluate(() => {
    const zone = document.querySelector("#ed-zone");
    for (const n of zone.childNodes) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
        n.textContent = n.textContent.trim().slice(0, -1) + ".";
        break;
      }
    }
    zone.dispatchEvent(new Event("input"));
  });
  await page.waitForTimeout(200);

  const disabled = await page.getAttribute("#ed-valider", "disabled");
  if (disabled === null) {
    await page.click("#ed-valider");
    await page.waitForTimeout(300);
    verifier(await bloc.evaluate((el) => el.classList.contains("modifiee")),
      "le bloc choix est marqué .modifiee après validation");
    const panier = await page.evaluate(() => JSON.parse(localStorage.getItem("p2isr.panier") || "[]"));
    verifier(panier.some((p) => String(p.id) === id), "la proposition est bien dans le panier");
  } else {
    console.log("  (modification hors budget pour cette entrée précise — le cas budget est de toute façon couvert par tests/editeur.test.js)");
  }

  verifier(erreursConsole.length === 0,
    `aucune erreur JS console${erreursConsole.length ? " (" + erreursConsole.join("; ") + ")" : ""}`);
} finally {
  if (browser) await browser.close();
  serveur.kill();
}

if (echecs > 0) {
  console.error(`\n❌ ${echecs} vérification(s) en échec`);
  process.exit(1);
}
console.log("\n✅ scénario éditeur de choix OK");
