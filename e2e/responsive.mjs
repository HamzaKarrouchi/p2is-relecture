#!/usr/bin/env node
// Non-régression responsive : vérifie l'absence de débordement horizontal
// (scrollWidth > largeur de viewport) sur les pages principales, à 375/768/1440px
// (cf. ROADMAP §5 « Vérifier le responsive sur appareils réels »). Hors CI /
// npm test, mêmes prérequis que e2e/editeur-choix.mjs (Playwright externe).
//
// Usage :
//   node e2e/responsive.mjs [port]
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = process.argv[2] || "8099";
const RACINE = new URL("..", import.meta.url).pathname;

const LARGEURS = [375, 768, 1440];
const PAGES = ["index.html", "scripts.html", "lecture.html?s=1", "dictionnaire.html", "apropos.html"];
const TOLERANCE = 1; // arrondi de scrollbar

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

  for (const largeur of LARGEURS) {
    console.log(`\n— ${largeur}px —`);
    const page = await browser.newPage({ viewport: { width: largeur, height: 800 } });
    const erreursConsole = [];
    page.on("pageerror", (e) => erreursConsole.push(e.message));

    for (const chemin of PAGES) {
      await page.goto(`http://localhost:${PORT}/${chemin}`);
      await page.waitForTimeout(600);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      verifier(scrollWidth <= largeur + TOLERANCE,
        `${chemin} : pas de débordement horizontal (scrollWidth=${scrollWidth} ≤ ${largeur})`);
    }
    verifier(erreursConsole.length === 0,
      `aucune erreur JS console à ${largeur}px${erreursConsole.length ? " (" + erreursConsole.join("; ") + ")" : ""}`);
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  serveur.kill();
}

if (echecs > 0) {
  console.error(`\n❌ ${echecs} vérification(s) en échec`);
  process.exit(1);
}
console.log("\n✅ responsive OK sur 375/768/1440px");
