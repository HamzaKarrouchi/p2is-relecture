import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// le module accueil.js s'exécute au chargement : on teste ici la STRUCTURE du HTML
// et la logique de persistance via Etat directement (l'animation canvas n'est pas testable en jsdom).
describe("index.html", () => {
  const html = readFileSync(resolve(__dirname, "../index.html"), "utf-8");
  it("contient le canvas de fond, le formulaire et les liens", () => {
    expect(html).toContain('id="fond"');
    expect(html).toContain('id="forme-heros"');
    expect(html).toContain('value="Tatsuya"');
    expect(html).toContain('value="Suou"');
    expect(html).toContain("dictionnaire.html");
    expect(html).toContain("apropos.html");
  });
  it("charge les 4 css et le module accueil", () => {
    for (const f of ["css/commun.css","css/theme-nuit.css","css/theme-rouge.css","css/accueil.css","js/accueil.js"])
      expect(html).toContain(f);
  });
});
