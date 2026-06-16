# Refonte visuelle Velvet Editorial — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la peau du site P2IS Relecture dans la direction « Velvet Editorial » (grimoire de relecture nocturne, serif, palette Persona 2 IS) sans casser le moteur ni les contrats DOM.

**Architecture:** Reskin profond + restructuration ciblée. On garde tous les IDs/classes pilotés par le JS, le moteur de budget, la sécurité textContent. On réécrit le CSS (variables Velvet Nuit/Jour, composants serif, filets dorés), on auto-héberge les polices, on ajoute des animations/popups dans des modules JS isolés, et on remplace les émojis de chrome par des SVG.

**Tech Stack:** HTML/CSS/JS vanilla (modules ES), multi-pages, zéro build. Tests : vitest + jsdom (JS), unittest (Python). Polices auto-hébergées (woff2).

**Référence spec :** `docs/superpowers/specs/2026-06-16-redesign-velvet-editorial-design.md`

**Rappels durs :**
- Toujours `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture <cmd>`.
- Branche de travail : `redesign-velvet-editorial` (déjà créée, jamais committer sur `main`).
- Messages de commit en français, **sans aucune mention d'IA**.
- Jamais d'`innerHTML` avec des données de la trad ; `textContent`/`createElement`.
- Ne pas toucher `js/budget.js`, `js/etat.js` (logique), `sync.py`.
- Vérif après chaque tâche : `npm test` doit rester vert.

---

## Structure des fichiers

| Fichier | Rôle | Action |
|---|---|---|
| `font/*.woff2` | Polices auto-hébergées | Créer |
| `css/typographie.css` | `@font-face` Cormorant / Libre Baskerville | Créer |
| `css/theme-nuit.css` | Variables Velvet Nuit (défaut) | Réécrire |
| `css/theme-jour.css` | Variables Velvet Jour (← `theme-rouge.css` renommé) | Renommer + réécrire |
| `css/commun.css` | Layout + composants Velvet | Réécrire |
| `css/accueil.css` | Frontispice + révélation | Réécrire |
| `js/theme.js` | Valeurs `nuit`/`jour`, défaut `nuit` | Modifier |
| `js/reveal.js` | Logique de révélation portrait+nom (testable) | Créer |
| `js/toast.js` | Toasts (remplace `alert`) | Créer |
| `js/accueil.js` | Brancher reveal + toast + recolor papillon | Modifier |
| `index.html` … `apropos.html` | `<link>`, `data-theme`, SVG, structure | Modifier |
| `tests/theme.test.js` | Valeurs nuit/jour | Modifier |
| `tests/accueil.test.js` | Liste CSS | Modifier |
| `tests/reveal.test.js` | Tests reveal | Créer |
| `tests/toast.test.js` | Tests toast | Créer |
| `maquettes-styles.html` | Prévisualisation jetable | Supprimer (Task 12) |

---

## Task 1 : Polices auto-hébergées + `typographie.css`

**Files:**
- Create: `font/cormorant-500.woff2`, `font/cormorant-italic-600.woff2`, `font/libre-baskerville-400.woff2`, `font/libre-baskerville-700.woff2`, `font/libre-baskerville-italic-400.woff2`
- Create: `css/typographie.css`

- [ ] **Step 1 : Télécharger les woff2 via google-webfonts-helper**

Run :
```bash
cd /home/pchamza/Project/P2IS_Relecture/p2is-relecture
mkdir -p font tmp-fonts
# Cormorant Garamond (500 normal, 600 italique)
curl -sL "https://gwfh.mranftl.com/api/fonts/cormorant-garamond?download=zip&subsets=latin&variants=500,600italic&formats=woff2" -o tmp-fonts/cormorant.zip
# Libre Baskerville (400, 700, 400 italique)
curl -sL "https://gwfh.mranftl.com/api/fonts/libre-baskerville?download=zip&subsets=latin&variants=regular,700,italic&formats=woff2" -o tmp-fonts/libre.zip
unzip -o tmp-fonts/cormorant.zip -d tmp-fonts/cormorant
unzip -o tmp-fonts/libre.zip -d tmp-fonts/libre
# Renommer vers des noms stables
cp tmp-fonts/cormorant/*500*.woff2 font/cormorant-500.woff2
cp tmp-fonts/cormorant/*600italic*.woff2 font/cormorant-italic-600.woff2
cp tmp-fonts/libre/*regular*.woff2 font/libre-baskerville-400.woff2
cp tmp-fonts/libre/*700*.woff2 font/libre-baskerville-700.woff2
cp tmp-fonts/libre/*italic*.woff2 font/libre-baskerville-italic-400.woff2
rm -rf tmp-fonts
ls -la font/
```
Expected : 5 fichiers `.woff2` non vides dans `font/`.
> Repli si gwfh indisponible : récupérer les mêmes variantes depuis `fonts.google.com` (Download family) et les renommer à l'identique.

- [ ] **Step 2 : Écrire `css/typographie.css`**

```css
/* Polices auto-hébergées — Velvet Editorial */
@font-face{ font-family:"Cormorant Garamond"; font-style:normal; font-weight:500;
  font-display:swap; src:url("../font/cormorant-500.woff2") format("woff2"); }
@font-face{ font-family:"Cormorant Garamond"; font-style:italic; font-weight:600;
  font-display:swap; src:url("../font/cormorant-italic-600.woff2") format("woff2"); }
@font-face{ font-family:"Libre Baskerville"; font-style:normal; font-weight:400;
  font-display:swap; src:url("../font/libre-baskerville-400.woff2") format("woff2"); }
@font-face{ font-family:"Libre Baskerville"; font-style:normal; font-weight:700;
  font-display:swap; src:url("../font/libre-baskerville-700.woff2") format("woff2"); }
@font-face{ font-family:"Libre Baskerville"; font-style:italic; font-weight:400;
  font-display:swap; src:url("../font/libre-baskerville-italic-400.woff2") format("woff2"); }

:root{
  --ff-titre:"Cormorant Garamond", Georgia, "Times New Roman", serif;
  --ff-corps:"Libre Baskerville", Georgia, "Times New Roman", serif;
}
```

- [ ] **Step 3 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add font css/typographie.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: polices auto-hébergées Cormorant/Libre Baskerville (Velvet)"
```

---

## Task 2 : Thèmes Velvet Nuit/Jour (rename + valeurs) — TDD

**Files:**
- Modify: `tests/theme.test.js`
- Modify: `js/theme.js`
- Rename+Modify: `css/theme-rouge.css` → `css/theme-jour.css`
- Modify: `css/theme-nuit.css`
- Modify: `tests/accueil.test.js`
- Modify: `index.html`, `scripts.html`, `lecture.html`, `dictionnaire.html`, `apropos.html` (links + `data-theme`)

- [ ] **Step 1 : Mettre à jour le test du thème (échouera)**

Remplacer le contenu de `tests/theme.test.js` par :
```js
import { describe, it, expect, beforeEach } from "vitest";
import { initTheme, basculerTheme, appliquerTheme } from "../js/theme.js";
import { Etat } from "../js/etat.js";

beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = ""; });

describe("theme", () => {
  it("init applique le thème par défaut nuit (Velvet)", () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
  it("bascule nuit <-> jour et persiste", () => {
    initTheme();
    basculerTheme();
    expect(document.documentElement.dataset.theme).toBe("jour");
    expect(Etat.get("theme", "")).toBe("jour");
  });
  it("init relit le thème persisté", () => {
    appliquerTheme("jour");
    document.documentElement.dataset.theme = "";
    initTheme();
    expect(document.documentElement.dataset.theme).toBe("jour");
  });
  it("rejette une valeur inconnue en retombant sur nuit", () => {
    appliquerTheme("xxx");
    expect(document.documentElement.dataset.theme).toBe("nuit");
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run : `npm test -- theme`
Expected : FAIL (le défaut vaut encore `rouge`).

- [ ] **Step 3 : Mettre à jour `js/theme.js`**

```js
import { Etat } from "./etat.js";

export function appliquerTheme(t) {
  if (t !== "nuit" && t !== "jour") t = "nuit";
  document.documentElement.dataset.theme = t;
  Etat.set("theme", t);
}

export function initTheme() {
  appliquerTheme(Etat.get("theme", "nuit"));
}

export function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "nuit" ? "jour" : "nuit");
}
```

- [ ] **Step 4 : Renommer et réécrire le thème clair**

Run : `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture mv css/theme-rouge.css css/theme-jour.css`

Puis remplacer le contenu de `css/theme-jour.css` par :
```css
:root[data-theme="jour"] {
  --fond:#F4ECDC; --fond2:#EDE3CF; --carte:#FBF6EA; --bord:#D8C9A8;
  --texte:#2A2118; --texte2:#6B5E45; --accent:#9A6E22; --rouge:#A8322E;
  --heros-fond:#F3E7D2; --heros-bord:#A8322E; --heros-nom:#8A2F2C;
  --pnj-nom:#9A6E22; --dico:#9A6E22; --philemon:#3E5C9A;
  --rayon:2px; --ombre:0 6px 18px rgba(42,33,24,.14); --voile:rgba(42,33,24,.35);
}
```

- [ ] **Step 5 : Réécrire `css/theme-nuit.css`**

```css
:root[data-theme="nuit"] {
  --fond:#14110D; --fond2:#1B1712; --carte:#1C1A17; --bord:#3A342C;
  --texte:#ECE6DC; --texte2:#A89C88; --accent:#C8A24B; --rouge:#B43A3A;
  --heros-fond:#1F1714; --heros-bord:#B43A3A; --heros-nom:#E0A6A0;
  --pnj-nom:#C8A24B; --dico:#C8A24B; --philemon:#8FB7FF;
  --rayon:2px; --ombre:0 8px 24px rgba(0,0,0,.55); --voile:rgba(0,0,0,.55);
}
```

- [ ] **Step 6 : Mettre à jour les `<link>` et `data-theme` des 5 pages**

Dans **chaque** fichier `index.html`, `scripts.html`, `lecture.html`, `dictionnaire.html`, `apropos.html` :
- remplacer `data-theme="rouge"` → `data-theme="nuit"` sur `<html>` ;
- remplacer la ligne `<link rel="stylesheet" href="css/theme-rouge.css">` par les deux lignes :
```html
  <link rel="stylesheet" href="css/typographie.css">
  <link rel="stylesheet" href="css/theme-jour.css">
```
(L'ordre final des `<link>` : `commun.css`, `theme-nuit.css`, `typographie.css`, `theme-jour.css`, puis `accueil.css` pour `index.html` seulement.)

- [ ] **Step 7 : Mettre à jour `tests/accueil.test.js`**

Remplacer le `it("charge les 4 css …")` par :
```js
  it("charge les css (commun, thèmes, typo) et le module accueil", () => {
    for (const f of ["css/commun.css","css/theme-nuit.css","css/theme-jour.css",
                     "css/typographie.css","css/accueil.css","js/accueil.js"])
      expect(html).toContain(f);
  });
```

- [ ] **Step 8 : Lancer la suite → vert**

Run : `npm test`
Expected : PASS (43+). Si un test échoue ailleurs, c'est qu'un sélecteur a bougé — corriger sans changer la logique.

- [ ] **Step 9 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add -A
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: thèmes Velvet Nuit/Jour (défaut Nuit), palette Persona 2 IS"
```

---

## Task 3 : `commun.css` — base, barre, chrome (réécriture, partie 1)

**Files:**
- Modify (réécriture intégrale, faite en 3 tâches) : `css/commun.css`

> Tasks 3–5 réécrivent `commun.css` en entier. Pour éviter un état cassé entre les tâches, on écrit le **fichier complet** en Task 3 (toutes les sections), puis Tasks 4–5 affinent les blocs bulles/cartes. En pratique : Task 3 produit un `commun.css` cohérent et complet ; 4 et 5 le polissent.

- [ ] **Step 1 : Réécrire `css/commun.css` (version Velvet complète)**

```css
* { box-sizing: border-box; }
:root{ color-scheme: dark; }
body {
  margin: 0; color: var(--texte);
  font-family: var(--ff-corps, Georgia, serif);
  font-size: 16px; line-height: 1.65;
  background:
    radial-gradient(1200px 640px at 50% -12%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 62%),
    var(--fond);
  background-attachment: fixed;
  transition: background-color .3s ease, color .3s ease;
}

.page { max-width: 760px; margin: 0 auto; padding: 18px 16px 72px; }

/* ── Barre ─────────────────────────────────────────── */
.barre{ display:flex; align-items:center; gap:12px; justify-content:space-between;
  padding:12px 18px; border-bottom:1px solid var(--accent);
  position:sticky; top:0; z-index:5;
  background:linear-gradient(180deg, var(--fond2), color-mix(in srgb, var(--fond2) 70%, transparent));
  backdrop-filter:blur(6px); box-shadow:var(--ombre); }
.barre a{ color:var(--texte); text-decoration:none; font-family:var(--ff-titre);
  font-style:italic; font-weight:600; letter-spacing:.5px; font-size:1.15em;
  display:inline-flex; align-items:center; gap:8px; }
.barre a:hover{ color:var(--accent); }
.barre a svg, .barre button svg{ width:18px; height:18px; flex:none; }
#titre{ color:var(--texte2); font-style:italic; font-family:var(--ff-titre); flex:1; font-size:1.05em; }
.barre .toggle{ display:inline-flex; align-items:center; gap:5px; color:var(--texte2);
  font-size:.85em; cursor:pointer; white-space:nowrap; }
.barre button{ display:inline-flex; align-items:center; gap:6px;
  background:var(--carte); border:1px solid var(--bord); color:var(--texte);
  min-height:36px; padding:6px 12px; border-radius:var(--rayon); cursor:pointer;
  font-family:var(--ff-corps); font-size:.85em; line-height:1; white-space:nowrap; }
.barre button:hover{ border-color:var(--accent); color:var(--accent); }
.barre button.principal{ background:var(--rouge); border-color:var(--rouge); color:#fff; }
.barre button.principal:hover{ background:color-mix(in srgb,var(--rouge) 80%, #000); color:#fff; }
#badge-panier:not(:empty),#badge-panier-fin:not(:empty){
  display:inline-block; min-width:18px; padding:0 5px; border-radius:9px;
  background:var(--accent); color:var(--fond); font-weight:700; font-size:.82em; text-align:center; }
#avancement{ color:var(--texte2); font-size:.82em; white-space:nowrap; font-style:italic; }

/* ── Outils (recherche / filtres) ─────────────────── */
.outils{ display:flex; gap:10px; margin:18px 0; flex-wrap:wrap; }
.outils input,.outils select{ background:var(--fond2); border:1px solid var(--bord);
  color:var(--texte); padding:9px 12px; border-radius:var(--rayon); flex:1; min-width:180px;
  font-family:var(--ff-corps); }
.outils input::placeholder{ color:var(--texte2); font-style:italic; }

/* ── Bulles de dialogue ───────────────────────────── */
.bulle { display:flex; gap:14px; margin:18px 0; align-items:flex-start; }
.bulle.heros { flex-direction:row-reverse; justify-content:flex-end; }
.avatar{ width:70px; height:70px; border-radius:var(--rayon); background:var(--carte);
  border:1px solid var(--pnj-nom); display:flex; align-items:center; justify-content:center;
  font-size:32px; flex:none; overflow:hidden; box-shadow:var(--ombre); }
.avatar img{ width:100%; height:100%; object-fit:cover; }
.bulle.heros .avatar{ width:104px; height:104px; font-size:44px; border-color:var(--heros-bord);
  box-shadow:0 0 0 1px var(--heros-bord), var(--ombre); }
.contenu{ position:relative; background:var(--carte); border:1px solid var(--bord);
  border-left:3px solid var(--pnj-nom); border-radius:0 var(--rayon) var(--rayon) var(--rayon);
  padding:11px 16px; max-width:78%; line-height:1.7; box-shadow:var(--ombre); }
.bulle.heros .contenu{ background:var(--heros-fond); border-color:var(--heros-bord);
  border-left:1px solid var(--heros-bord); border-right:3px solid var(--heros-bord);
  border-radius:var(--rayon) 0 var(--rayon) var(--rayon); }
.nom{ font-family:var(--ff-titre); font-style:italic; font-weight:600; color:var(--pnj-nom);
  font-size:1em; letter-spacing:.4px; margin-bottom:2px; }
.bulle.heros .nom{ color:var(--heros-nom); }
.pause{ opacity:.45; margin:0 .35em; font-size:.8em; }
.enc{ border:1px solid var(--accent); border-radius:3px; padding:0 .35em; color:var(--accent); }
.hl{ color:var(--dico); font-style:italic; }
.mot-dico{ color:var(--dico); border-bottom:1px dotted var(--dico); cursor:pointer; }

/* ── Choix ────────────────────────────────────────── */
.choix{ display:flex; flex-direction:column; gap:8px; margin:16px 0; align-items:flex-end; }
.choix .choix-titre{ font-family:var(--ff-titre); font-style:italic; font-size:.95em;
  color:var(--heros-nom); font-weight:600; opacity:.9; }
.choix button{ background:var(--heros-fond); border:1px solid var(--heros-bord);
  color:var(--texte); padding:9px 16px; border-radius:var(--rayon); cursor:pointer;
  text-align:right; max-width:78%; font-family:var(--ff-corps);
  transition:transform .12s ease, background .15s ease; }
.choix button:hover{ background:color-mix(in srgb,var(--heros-bord) 18%,var(--heros-fond));
  transform:translateX(-3px); }
.choix button.elu{ background:var(--rouge); border-color:var(--rouge); color:#fff; font-weight:700; }
.choix button.fane{ opacity:.3; }
.choix-entete{ display:flex; flex-direction:row-reverse; align-items:center; gap:10px; margin-bottom:2px; }
.choix-entete .avatar{ width:56px; height:56px; font-size:26px; border-color:var(--heros-bord); }

/* ── Comparaison EN / boutons de bulle ────────────── */
.version-en{ display:none; color:var(--texte2); font-size:.88em; margin-top:8px;
  border-top:1px dashed var(--bord); padding-top:6px; font-style:italic; }
body.compare .version-en,.bulle.montre-en .version-en{ display:block; }
.swap,.edit{ background:none; border:0; cursor:pointer; font-size:.8em; opacity:.4; float:right;
  padding:2px 5px; border-radius:3px; margin-left:4px; }
.swap:hover,.edit:hover{ opacity:1; }
.bulle.modifiee .contenu{ border-color:var(--dico); }
.warn{ color:var(--rouge); cursor:help; margin-left:6px; font-size:1em; }

/* ── Marginalia (infobulle dico) ──────────────────── */
.infobulle{ position:absolute; z-index:20; background:var(--carte);
  border:1px solid var(--accent); border-left:3px solid var(--accent);
  border-radius:var(--rayon); padding:8px 12px; font-size:.9em; max-width:min(260px,90vw);
  box-shadow:var(--ombre); font-style:italic; }
.infobulle a{ color:var(--accent); }

/* ── Sommaire : grille de scripts ─────────────────── */
.grille{ display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; }
.carte-script{ display:flex; flex-direction:column; gap:4px; background:var(--carte);
  border:1px solid var(--bord); border-left:3px solid var(--bord); border-radius:var(--rayon);
  padding:13px 15px; color:var(--texte); text-decoration:none; position:relative;
  transition:border-color .15s ease, box-shadow .15s ease, transform .1s ease; }
.carte-script:hover{ border-left-color:var(--accent); transform:translateY(-2px); box-shadow:var(--ombre); }
.carte-script.relu{ border-left-color:var(--accent); }
.carte-script.relu::after{ content:"✦"; position:absolute; top:10px; right:12px;
  color:var(--accent); font-size:.9em; opacity:.85; }
.carte-script.vide{ opacity:.5; }
.carte-script .no{ font-family:var(--ff-titre); font-style:italic; font-weight:600;
  color:var(--accent); font-size:1.2em; letter-spacing:.5px; }
.carte-script .label{ font-weight:700; }
.carte-script .persos,.carte-script .compte{ font-size:.78em; color:var(--texte2); font-style:italic; }
.placeholder-heros{ background:color-mix(in srgb,var(--philemon) 22%,transparent); border-radius:2px; padding:0 2px; }

/* ── Glossaire (dictionnaire) ─────────────────────── */
.table-dico{ width:100%; border-collapse:collapse; margin-top:14px; }
.table-dico th{ text-align:left; padding:8px 12px; border-bottom:2px solid var(--accent);
  font-family:var(--ff-titre); font-style:italic; color:var(--accent); }
.table-dico td{ text-align:left; padding:7px 12px; border-bottom:1px solid var(--bord); }
.table-dico tr:nth-child(even) td{ background:color-mix(in srgb,var(--carte) 50%,transparent); }
.table-dico td.en{ color:var(--texte2); font-style:italic; }
.table-dico td.fr{ color:var(--dico); }

/* ── Panneaux : atelier & carnet ──────────────────── */
#panneau-editeur,#panneau-panier{ position:fixed; right:0; top:0; bottom:0;
  width:min(480px,100vw); background:var(--fond2); border-left:2px solid var(--accent);
  padding:16px; overflow:auto; z-index:10; box-shadow:-12px 0 40px var(--voile);
  animation:panneau-entre .25s ease-out both; }
@keyframes panneau-entre{ from{ transform:translateX(20px); opacity:0; } to{ transform:none; opacity:1; } }
.jeton{ display:inline-block; background:var(--carte); border:1px solid var(--accent);
  border-radius:3px; padding:0 5px; margin:0 1px; font-size:.8em; user-select:all; cursor:default; }
#ed-zone{ background:var(--fond); border:1px solid var(--bord); border-radius:var(--rayon);
  padding:11px; min-height:90px; margin:8px 0; white-space:pre-wrap; }
.ed-en{ color:var(--texte2); font-size:.88em; border-left:3px solid var(--bord);
  padding-left:10px; margin:8px 0; white-space:pre-wrap; font-style:italic; }
#ed-jauge{ font-family:var(--ff-titre); font-style:italic; }
#ed-jauge.vert{ color:#6fae5a; } #ed-jauge.orange{ color:var(--accent); } #ed-jauge.rouge{ color:var(--rouge); }
#ed-erreurs{ color:var(--rouge); font-size:.88em; min-height:1.2em; }
#ed-valider{ width:100%; padding:11px; background:var(--rouge); color:#fff; border:0;
  border-radius:var(--rayon); font-family:var(--ff-titre); font-style:italic; font-weight:600;
  font-size:1.05em; cursor:pointer; }
#ed-valider:disabled{ opacity:.35; cursor:not-allowed; }
.pn-item{ display:flex; align-items:center; gap:6px; padding:7px 0;
  border-bottom:1px solid var(--bord); font-size:.92em; }
.pn-item span{ flex:1; color:var(--texte2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pn-item button{ background:none; border:0; cursor:pointer; opacity:.6; }
.pn-item button:hover{ opacity:1; }

/* ── Indicateur de suite + fin de script ──────────── */
#indicateur{ text-align:center; color:var(--texte2); font-size:1em; opacity:.7;
  padding:16px; cursor:pointer; user-select:none; font-style:italic;
  animation:pulse-indic 1.8s ease-in-out infinite; }
#indicateur:hover{ color:var(--accent); opacity:1; }
@keyframes pulse-indic{ 0%,100%{ opacity:.4; } 50%{ opacity:.85; } }
#fin{ margin-top:26px; padding:24px; text-align:center; background:var(--carte);
  border:1px solid var(--bord); border-top:2px solid var(--accent); border-radius:var(--rayon); }
.fin-titre{ font-family:var(--ff-titre); font-style:italic; letter-spacing:1px;
  color:var(--texte2); margin:0 0 16px; font-size:1.3em; }
.fin-actions{ display:flex; flex-wrap:wrap; gap:10px; justify-content:center; }
.fin-actions button{ background:var(--fond2); border:1px solid var(--bord); color:var(--texte);
  padding:10px 18px; border-radius:var(--rayon); cursor:pointer; font-family:var(--ff-corps); }
.fin-actions button:hover{ border-color:var(--accent); color:var(--accent); }
.fin-actions button.principal{ background:var(--rouge); border-color:var(--rouge); color:#fff; }
.fin-nav{ display:flex; justify-content:space-between; gap:12px; margin-top:20px; }
.fin-nav a{ color:var(--accent); text-decoration:none; font-style:italic; }
.fin-nav a:hover{ text-decoration:underline; }

/* ── Prose (À propos / colophon) ──────────────────── */
.prose{ line-height:1.75; max-width:680px; }
.prose h1{ font-family:var(--ff-titre); font-style:italic; letter-spacing:1px; margin:.2em 0 .5em; font-size:2em; }
.prose h2{ font-family:var(--ff-titre); font-style:italic; margin:1.3em 0 .3em; color:var(--accent); font-size:1.3em; }
.prose a{ color:var(--accent); }
.prose ul{ padding-left:1.3em; } .prose li{ margin:.35em 0; }

/* ── Toast ────────────────────────────────────────── */
#zone-toast{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%);
  display:flex; flex-direction:column; gap:8px; z-index:50; align-items:center; }
.toast{ background:var(--carte); border:1px solid var(--accent); border-left:3px solid var(--accent);
  color:var(--texte); padding:10px 16px; border-radius:var(--rayon); box-shadow:var(--ombre);
  font-style:italic; animation:toast-entre .25s ease-out both; }
.toast.erreur{ border-color:var(--rouge); border-left-color:var(--rouge); }
@keyframes toast-entre{ from{ transform:translateY(10px); opacity:0; } to{ transform:none; opacity:1; } }

/* ── Apparition des bulles ────────────────────────── */
@keyframes bulle-apparait{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
.bulle,.choix{ animation:bulle-apparait 200ms ease-out both; }

/* ── Focus visible (a11y) ─────────────────────────── */
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,
label:focus-visible,.choix button:focus-visible,.swap:focus-visible,.edit:focus-visible,
#ed-zone:focus-visible,[contenteditable]:focus-visible{
  outline:2px solid var(--accent); outline-offset:2px; }

/* ── Responsive ───────────────────────────────────── */
@media (max-width:600px){
  .contenu,.choix button{ max-width:88%; }
  .barre{ flex-wrap:wrap; gap:8px; padding:9px 12px; }
  #titre{ max-width:40vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #panneau-editeur,#panneau-panier{ width:100vw; }
  .fin-actions{ flex-direction:column; } .fin-actions button{ width:100%; }
}
@media (max-width:420px){ .grille{ grid-template-columns:1fr; } }

/* ── prefers-reduced-motion ───────────────────────── */
@media (prefers-reduced-motion: reduce){
  .bulle,.choix,#indicateur,#panneau-editeur,#panneau-panier,.toast{ animation:none; }
  body{ transition:none; }
  .carte-script:hover,.choix button:hover{ transform:none; }
}
```

- [ ] **Step 2 : Vérifier visuellement (sommaire + lecture)**

Run :
```bash
cd /home/pchamza/Project/P2IS_Relecture/p2is-relecture
pkill -f "http.server 8088" 2>/dev/null; (python3 -m http.server 8088 >/tmp/p2is.log 2>&1 &) ; sleep 1
curl -s -o /dev/null -w "scripts %{http_code}\n" http://localhost:8088/scripts.html
```
Ouvrir `http://localhost:8088/scripts.html` puis `lecture.html?s=1` : barre serif, cartes à filet doré, bulles aérées, thème Nuit par défaut, bascule Jour OK. Pas d'erreur console.

- [ ] **Step 3 : `npm test` (non-régression)**

Run : `npm test`
Expected : PASS.

- [ ] **Step 4 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: composants Velvet dans commun.css (barre, bulles, sommaire, panneaux)"
```

---

## Task 4 : Vérification fine bulles / lecture (polissage)

**Files:** Modify (si retouches) : `css/commun.css`

- [ ] **Step 1 : Inspecter `lecture.html?s=1` aux états réels**

Ouvrir un script avec choix + termes dico + comparaison EN. Vérifier :
- héros à droite (portrait agrandi, braise), PNJ à gauche (or) ;
- `.mot-dico` cliquable → marginalia stylé ;
- toggle « Afficher l'anglais » → `.version-en` lisible ;
- éditeur (`#panneau-editeur`) s'ouvre en slide, jauge change de couleur selon le budget.

- [ ] **Step 2 : Retoucher si nécessaire**

Ajuster uniquement les blocs concernés de `commun.css` (espacements, contrastes). Aucune nouvelle classe pilotée par JS.

- [ ] **Step 3 : Commit (si changements)**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "fix: polissage bulles et lecture (Velvet)"
```

---

## Task 5 : Accueil — frontispice + recolor papillon

**Files:**
- Modify: `css/accueil.css`
- Modify: `index.html` (structure frontispice, IDs préservés)
- Modify: `js/accueil.js` (couleurs du papillon → bleu Philémon)

- [ ] **Step 1 : Réécrire `css/accueil.css`**

```css
#fond{ position:fixed; inset:0; z-index:-1; }
.accueil{ min-height:100vh; display:flex; flex-direction:column; justify-content:center;
  align-items:center; text-align:center; gap:20px; }
.accueil h1{ font-family:var(--ff-titre); font-style:italic; font-weight:600;
  font-size:clamp(2.4rem,7vw,3.6rem); letter-spacing:2px; text-shadow:0 2px 20px rgba(0,0,0,.5);
  margin:0; display:flex; align-items:center; gap:.4em; }
.accueil h1 svg{ width:.9em; height:.9em; color:var(--philemon); }
.sous-titre{ color:var(--texte2); font-style:italic; margin-top:-6px; max-width:60ch; }
.rouge{ color:var(--rouge); }
#forme-heros{ display:flex; flex-direction:column; gap:12px;
  background:color-mix(in srgb,var(--fond2) 85%, transparent);
  padding:26px 32px; border:1px solid var(--bord);
  border-top:2px solid var(--accent); border-bottom:2px solid var(--accent);
  border-radius:var(--rayon); box-shadow:var(--ombre); }
#forme-heros label{ display:flex; flex-direction:column; gap:5px; text-align:left;
  font-style:italic; color:var(--texte2); font-size:.9em; }
#forme-heros input{ background:var(--fond); border:1px solid var(--bord); color:var(--texte);
  padding:10px 12px; border-radius:var(--rayon); font-size:1.05em; text-align:center;
  font-family:var(--ff-corps); }
#forme-heros button{ background:var(--rouge); color:#fff; border:0; padding:12px;
  border-radius:var(--rayon); font-family:var(--ff-titre); font-style:italic; font-weight:600;
  letter-spacing:.5px; cursor:pointer; font-size:1.1em; transition:background .15s ease; }
#forme-heros button:hover{ background:color-mix(in srgb,var(--rouge) 82%,#000); }
.liens{ display:flex; flex-wrap:wrap; justify-content:center; gap:6px 18px; }
.liens a,.liens label{ color:var(--texte2); text-decoration:none; cursor:pointer;
  font-style:italic; display:inline-flex; align-items:center; gap:6px; }
.liens a:hover,.liens label:hover{ color:var(--accent); }
.liens svg{ width:15px; height:15px; }

/* ── Révélation portrait + nom ────────────────────── */
#revele{ position:fixed; inset:0; z-index:60; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14px; background:var(--voile);
  backdrop-filter:blur(4px); }
#revele .cadre{ width:200px; height:200px; border-radius:var(--rayon); overflow:hidden;
  border:2px solid var(--accent); box-shadow:0 0 0 1px var(--accent), var(--ombre);
  animation:revele-portrait .8s ease-out both; }
#revele .cadre img{ width:100%; height:100%; object-fit:cover; }
#revele .nom-revele{ font-family:var(--ff-titre); font-style:italic; font-size:2rem;
  color:var(--texte); letter-spacing:1px; animation:revele-nom .6s .5s ease-out both; }
@keyframes revele-portrait{ from{ opacity:0; transform:scale(.85); } to{ opacity:1; transform:none; } }
@keyframes revele-nom{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
@media (prefers-reduced-motion: reduce){
  #revele .cadre,#revele .nom-revele{ animation:none; }
}
```

- [ ] **Step 2 : Réécrire la structure de `index.html`**

Remplacer le `<main>` par (IDs et valeurs préservés ; SVG papillon inline pour l'ornement et icônes de liens — symboles définis une fois) :
```html
  <canvas id="fond" aria-hidden="true"></canvas>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <symbol id="i-butterfly" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 6v15"/><path d="M12 6c-1.4-2.8-4.7-3.8-7-2.4C2.7 5 3.2 8.7 5.5 10.5c1.9 1.5 4.7 1.9 6.5 1"/><path d="M12 6c1.4-2.8 4.7-3.8 7-2.4 2.3 1.4 1.8 5.1-.5 6.9-1.9 1.5-4.7 1.9-6.5 1"/><path d="M12 12c-1.4 1.9-4.2 2.8-6 1.9-1.8-.9-1-4.4 1.3-3.5"/><path d="M12 12c1.4 1.9 4.2 2.8 6 1.9 1.8-.9 1-4.4-1.3-3.5"/>
    </symbol>
    <symbol id="i-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4Z"/><path d="M4 4v14"/></symbol>
    <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 21h14"/></symbol>
    <symbol id="i-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="m7 13 5-4 5 4"/><path d="M5 3h14"/></symbol>
  </defs></svg>
  <main class="page accueil">
    <h1><svg><use href="#i-butterfly"/></svg> P2IS <span class="rouge">Relecture</span></h1>
    <p class="sous-titre">Relire la traduction française de Persona&nbsp;2: Innocent&nbsp;Sin</p>
    <form id="forme-heros">
      <label>Prénom du protagoniste
        <input id="prenom" value="Tatsuya" maxlength="12" autocomplete="off"></label>
      <label>Nom de famille
        <input id="nomfam" value="Suou" maxlength="12" autocomplete="off"></label>
      <button type="submit">Commencer la relecture</button>
    </form>
    <nav class="liens">
      <a href="dictionnaire.html"><svg><use href="#i-book"/></svg> Dictionnaire</a>
      <a href="apropos.html"><svg><use href="#i-info"/></svg> À propos</a>
      <a href="#" id="exporter-save"><svg><use href="#i-download"/></svg> Exporter ma sauvegarde</a>
      <label id="importer-save" class="lien-fichier"><svg><use href="#i-upload"/></svg> Importer<input type="file" accept="application/json" hidden></label>
    </nav>
  </main>
  <script type="module" src="js/accueil.js"></script>
```
> `accueil.test.js` vérifie la présence de `value="Tatsuya"`, `value="Suou"`, `id="fond"`, `id="forme-heros"`, `dictionnaire.html`, `apropos.html` — tous conservés.

- [ ] **Step 3 : Recolorer le papillon (bleu Philémon) dans `js/accueil.js`**

Dans la fonction `papillon`, remplacer `ctx.fillStyle = "rgba(110,180,255,.85)";` par `ctx.fillStyle = "rgba(143,183,255,.88)";` et `ctx.fillStyle = "rgba(20,40,80,.9)";` (corps) par `ctx.fillStyle = "rgba(28,40,80,.92)";`.
Dans `boucle`, garder les flammes mais adoucir : `g.addColorStop(0, "rgba(143,183,255,.40)");` et `g.addColorStop(1, "rgba(143,183,255,0)");`.

- [ ] **Step 4 : Vérifier l'accueil + `npm test`**

Ouvrir `http://localhost:8088/` : frontispice serif, papillon bleu, ornement, liens à icônes.
Run : `npm test` → PASS.

- [ ] **Step 5 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add css/accueil.css index.html js/accueil.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: frontispice Velvet + papillon Philémon + icônes SVG (accueil)"
```

---

## Task 6 : Logique de révélation portrait+nom — TDD

**Files:**
- Create: `js/reveal.js`
- Create: `tests/reveal.test.js`
- Modify: `js/accueil.js` (brancher la révélation à la soumission)

- [ ] **Step 1 : Écrire le test (échouera)**

`tests/reveal.test.js` :
```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dureeRevele, construireRevele } from "../js/reveal.js";

beforeEach(() => { document.body.innerHTML = ""; });

describe("dureeRevele", () => {
  it("≈1200ms en mouvement normal", () => expect(dureeRevele(false)).toBe(1200));
  it("0ms si reduced-motion", () => expect(dureeRevele(true)).toBe(0));
});

describe("construireRevele", () => {
  it("insère un overlay #revele avec le portrait et le nom (textContent)", () => {
    construireRevele({ prenom: "Maya", nom: "Amano", portrait: "img/portraits/Tatsuya.webp" });
    const ov = document.getElementById("revele");
    expect(ov).toBeTruthy();
    expect(ov.querySelector("img").getAttribute("src")).toBe("img/portraits/Tatsuya.webp");
    expect(ov.querySelector(".nom-revele").textContent).toBe("Maya Amano");
  });
  it("échappe le nom (pas d'injection HTML)", () => {
    construireRevele({ prenom: "<b>x</b>", nom: "", portrait: "img/portraits/Tatsuya.webp" });
    const nom = document.querySelector("#revele .nom-revele");
    expect(nom.querySelector("b")).toBeNull();
    expect(nom.textContent).toContain("<b>x</b>");
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run : `npm test -- reveal`
Expected : FAIL (`js/reveal.js` introuvable).

- [ ] **Step 3 : Écrire `js/reveal.js`**

```js
// Révélation du protagoniste (portrait + nom) avant d'entrer dans la relecture.
// Aucune donnée HTML : on utilise createElement/textContent uniquement.
export function dureeRevele(reduit) { return reduit ? 0 : 1200; }

export function construireRevele({ prenom, nom, portrait }) {
  const ov = document.createElement("div");
  ov.id = "revele";
  const cadre = document.createElement("div");
  cadre.className = "cadre";
  const img = document.createElement("img");
  img.src = portrait; img.alt = "";
  cadre.appendChild(img);
  const titre = document.createElement("div");
  titre.className = "nom-revele";
  titre.textContent = [prenom, nom].filter(Boolean).join(" ");
  ov.append(cadre, titre);
  document.body.appendChild(ov);
  return ov;
}
```

- [ ] **Step 4 : Lancer → vert**

Run : `npm test -- reveal`
Expected : PASS.

- [ ] **Step 5 : Brancher dans `js/accueil.js`**

Remplacer le handler `submit` par :
```js
import { dureeRevele, construireRevele } from "./reveal.js";
// …
document.getElementById("forme-heros").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const heros = { prenom: champPrenom.value.trim() || "Tatsuya",
                  nom: champNom.value.trim() || "Suou" };
  Etat.set("heros", heros);
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const aller = () => { location.href = "scripts.html"; };
  if (reduit) return aller();
  construireRevele({ ...heros, portrait: "img/portraits/Tatsuya.webp" });
  setTimeout(aller, dureeRevele(false));
});
```

- [ ] **Step 6 : Vérifier l'animation + `npm test`**

Ouvrir l'accueil, saisir un nom, valider → portrait + nom apparaissent ~1,2 s puis sommaire. Avec reduced-motion : redirection immédiate.
Run : `npm test` → PASS.

- [ ] **Step 7 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/reveal.js tests/reveal.test.js js/accueil.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: animation de révélation portrait+nom à l'entrée"
```

---

## Task 7 : Icônes SVG de chrome sur les pages internes

**Files:** Modify: `scripts.html`, `lecture.html`, `dictionnaire.html`, `apropos.html`

- [ ] **Step 1 : Ajouter le bloc `<symbol>` partagé**

Dans chaque page interne, juste après `<body>`, insérer (icônes utilisées par la barre) :
```html
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <symbol id="i-butterfly" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v15"/><path d="M12 6c-1.4-2.8-4.7-3.8-7-2.4C2.7 5 3.2 8.7 5.5 10.5c1.9 1.5 4.7 1.9 6.5 1"/><path d="M12 6c1.4-2.8 4.7-3.8 7-2.4 2.3 1.4 1.8 5.1-.5 6.9-1.9 1.5-4.7 1.9-6.5 1"/><path d="M12 12c-1.4 1.9-4.2 2.8-6 1.9-1.8-.9-1-4.4 1.3-3.5"/><path d="M12 12c1.4 1.9 4.2 2.8 6 1.9 1.8-.9 1-4.4-1.3-3.5"/></symbol>
    <symbol id="i-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></symbol>
    <symbol id="i-pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></symbol>
  </defs></svg>
```

- [ ] **Step 2 : Remplacer les émojis de chrome par `<svg><use/></svg>`**

- `scripts.html` / `dictionnaire.html` / `apropos.html` : le lien logo `🦋 P2IS Relecture` → `<svg><use href="#i-butterfly"/></svg> P2IS Relecture` ; bouton `🌙 Thème` → `<svg><use href="#i-theme"/></svg> Thème`.
- `lecture.html` : `← Scripts` → `<svg><use href="#i-back"/></svg> Scripts` ; `🌙 Thème` → `i-theme` ; `✍️ Mes propositions` (les deux boutons `#btn-panier` et `#btn-panier-fin`) → `<svg><use href="#i-pen"/></svg> Mes propositions` ; garder `⏬ Tout afficher` (ou le remplacer par un libellé texte simple « Tout afficher »).
- **Ne pas** toucher aux emojis de portraits de personnages.
- Les `🔎` dans les `placeholder` d'input : remplacer par du texte simple (« Rechercher un texte, un numéro… ») — un emoji dans un placeholder n'est pas une icône de chrome.

- [ ] **Step 3 : Vérifier les 4 pages + `npm test`**

Ouvrir chaque page : icônes SVG nettes, alignées, pas d'émoji de chrome restant.
Run : `npm test` → PASS (la grille teste `.carte-script`, intacts).

- [ ] **Step 4 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add scripts.html lecture.html dictionnaire.html apropos.html
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: icônes SVG de chrome sur les pages internes"
```

---

## Task 8 : Toasts (remplace `alert`) — TDD

**Files:**
- Create: `js/toast.js`
- Create: `tests/toast.test.js`
- Modify: `js/accueil.js` (import échoué → toast d'erreur)

- [ ] **Step 1 : Écrire le test (échouera)**

`tests/toast.test.js` :
```js
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
```

- [ ] **Step 2 : Lancer → échec**

Run : `npm test -- toast`
Expected : FAIL.

- [ ] **Step 3 : Écrire `js/toast.js`**

```js
// Petit toast non bloquant (remplace alert). textContent uniquement.
export function toast(message, { erreur = false, duree = 3200 } = {}) {
  let zone = document.getElementById("zone-toast");
  if (!zone) { zone = document.createElement("div"); zone.id = "zone-toast"; document.body.appendChild(zone); }
  const el = document.createElement("div");
  el.className = "toast" + (erreur ? " erreur" : "");
  el.textContent = message;
  zone.appendChild(el);
  setTimeout(() => { el.remove(); if (!zone.children.length) zone.remove(); }, duree);
  return el;
}
```

- [ ] **Step 4 : Lancer → vert**

Run : `npm test -- toast`
Expected : PASS.

- [ ] **Step 5 : Utiliser le toast dans `js/accueil.js`**

Ajouter `import { toast } from "./toast.js";` puis, dans `inputImport.onchange`, remplacer `catch { alert("Fichier de sauvegarde invalide."); }` par :
```js
  catch { toast("Fichier de sauvegarde invalide.", { erreur: true }); }
```
Et après un import réussi, avant `location.reload()`, on peut laisser le reload (le toast n'aurait pas le temps de s'afficher).

- [ ] **Step 6 : `npm test`**

Run : `npm test` → PASS.

- [ ] **Step 7 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/toast.js tests/toast.test.js js/accueil.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: toasts non bloquants (remplace alert à l'import)"
```

---

## Task 9 : Pages Glossaire & Colophon (structure/ornements)

**Files:** Modify: `dictionnaire.html`, `apropos.html`

- [ ] **Step 1 : Dictionnaire — titre de section**

Dans `dictionnaire.html`, remplacer `<span>Dictionnaire</span>` par `<span id="titre">Glossaire</span>` et ajouter au-dessus du tableau une intro :
```html
    <p class="sous-glossaire" style="color:var(--texte2);font-style:italic;margin:6px 0 0;">Lexique des termes du jeu, anglais → français.</p>
```
(Le `<input id="q">` et `#tableau-dico` restent inchangés.)

- [ ] **Step 2 : À propos — colophon**

Dans `apropos.html`, remplacer `<span>À propos</span>` par `<span id="titre">Colophon</span>`. La prose est déjà stylée par `.prose` (Task 3). Ajouter un ornement avant le `<h1>` :
```html
    <p style="text-align:center;color:var(--accent);font-size:1.4em;margin:0;">❦</p>
```

- [ ] **Step 3 : Vérifier + `npm test`**

Ouvrir `dictionnaire.html` (recherche live OK) et `apropos.html`.
Run : `npm test` → PASS (`dico.test.js` inchangé).

- [ ] **Step 4 : Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add dictionnaire.html apropos.html
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: pages Glossaire et Colophon (Velvet)"
```

---

## Task 10 : Passe responsive (375 / 768 / 1024 / 1440)

**Files:** Modify (si retouches) : `css/commun.css`, `css/accueil.css`

- [ ] **Step 1 : Tester les 4 largeurs**

Avec les DevTools (ou redimensionnement), vérifier sur `index`, `scripts`, `lecture`, `dictionnaire`, `apropos` :
- 375 px : pas de scroll horizontal, barre enroulée, panneaux plein écran, grille 1 colonne, cibles ≥44 px ;
- 768 px : grille 2–3 colonnes, bulles lisibles ;
- 1024 / 1440 px : `.page` centrée (max 760 px), pas d'étirement disgracieux.

- [ ] **Step 2 : Ajuster les media queries si besoin**

Compléter les blocs `@media` de `commun.css`/`accueil.css` uniquement (pas de logique). Veiller au contraste AA en thème Jour.

- [ ] **Step 3 : Commit (si changements)**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add css/commun.css css/accueil.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "fix: passe responsive 375/768/1024/1440 (Velvet)"
```

---

## Task 11 : Vérification complète (suite de tests + revue manuelle)

**Files:** aucun (vérification)

- [ ] **Step 1 : Suite JS**

Run : `npm test`
Expected : tous verts (anciens + `reveal`, `toast`).

- [ ] **Step 2 : Suite Python**

Run : `python3 -m unittest discover tests_py -q`
Expected : OK (inchangé).

- [ ] **Step 3 : Parcours manuel complet**

Accueil → saisir nom → révélation → sommaire → ouvrir un script → lire (bulles, choix, dico) → proposer une modif (jauge) → carnet → export Discord → bascule thème Nuit/Jour sur chaque page.

- [ ] **Step 4 : Console propre**

Aucune erreur JS, aucune 404 (vérifier les woff2 et `theme-jour.css`).

---

## Task 12 : Nettoyage et clôture de branche

**Files:** Delete: `maquettes-styles.html`

- [ ] **Step 1 : Supprimer la maquette jetable**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture rm maquettes-styles.html 2>/dev/null || rm -f maquettes-styles.html
```

- [ ] **Step 2 : Mettre à jour `ROADMAP.md`**

Ajouter une entrée « Refonte Velvet Editorial » avec l'état (fait) et le lien vers ce plan.

- [ ] **Step 3 : Commit final**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add -A
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "chore: nettoyage maquette + ROADMAP (refonte Velvet)"
```

- [ ] **Step 4 : Clôture**

Invoquer la skill `superpowers:finishing-a-development-branch` pour décider du merge de `redesign-velvet-editorial` vers `main`.

---

## Auto-revue du plan

- **Couverture spec :** palette (T2), typo (T1), frontispice+révélation (T5–T6), sommaire (T3), lecture/atelier/carnet/marginalia (T3–T4), glossaire/colophon (T9), popups & animations (T5,T6,T8 + keyframes T3), SVG chrome (T5,T7), responsive (T3,T10), thème Nuit/Jour (T2), contrats DOM préservés (toutes tâches), tests TDD (T2,T6,T8), nettoyage maquette (T12). ✓
- **Placeholders :** aucun « TBD/TODO » ; code complet fourni pour chaque étape logique et CSS.
- **Cohérence des noms :** `dureeRevele`/`construireRevele`/`toast` identiques entre tests et implémentation ; variables CSS (`--ff-titre`, `--ombre`, `--voile`, `--philemon`) définies en T1/T2 avant usage en T3+.
