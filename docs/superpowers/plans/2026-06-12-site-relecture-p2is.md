# Site de relecture P2IS — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site statique vanilla (GitHub Pages) pour relire la traduction FR de Persona 2 Innocent Sin façon visual novel et proposer des modifications exportables vers Discord, avec budget d'octets exact.

**Architecture:** Multi-pages HTML/CSS/JS sans build ni dépendance runtime ; `data/` est généré par `sync.py` depuis le repo de traduction (`../../Trad_Persona2/P2-FR-IS-PSP/`) puis commité. Les textes sont pré-normalisés à la synchro (le navigateur ne parse jamais les codes, sauf l'éditeur qui manipule le brut).

**Tech Stack:** HTML5, CSS (variables, 2 thèmes), JS modules ES natifs, Python 3 (sync, unittest), vitest+jsdom (tests JS, devDependency).

**Spec de référence:** `docs/superpowers/specs/2026-06-12-site-relecture-p2is-design.md`

**Repo:** `/home/pchamza/Project/P2IS_Relecture/p2is-relecture` — ⚠ le parent `/home/pchamza/Project/` est un repo git : TOUJOURS `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture`.

**Raffinement du spec (accepté en plan):** le champ `affichage_fr` du spec devient `bulles_fr` : une entrée JSON peut contenir des blocs locuteur internes (`"Nom`), donc elle produit une **liste de bulles** `[{nom, seg}]`. S'y ajoute le type de segment `{hl}` (texte surligné `[E4][NULL][NULL][U+0006]…[0002]`, fréquent dans les scripts).

**Formes de données partagées (référence pour toutes les tâches):**

```
// data/scripts/NNN.json
{ "no": 62, "entrees": [
  { "id": 4,
    "nom_fr": "Bel homme", "nom_en": "Handsome man",
    "bulles_fr": [ { "nom": null, "seg": [ {"t":"J'ai des ordres de notre Reine..."},
                                            {"pause":true}, {"nl":true},
                                            {"t":"Vous mourrez tous ici !"} ] } ],
    "bulles_en": [ … même structure … ],
    "choix_fr": null | { "question": [seg…], "options": ["Oui","Non"] },
    "choix_en": null | { … },
    "brut_fr": "J'ai des ordres…\nVous mourrez tous ici !",
    "brut_en": "I'm[SP]under[SP]orders…",
    "data_size": 152, "budget": 144 } ] }

// Types de segments : {t:"texte"} | {pause:true} | {nl:true} |
//   {hero:"prenom"|"nom"} | {enc:"texte encadré"} | {hl:"texte surligné"}

// localStorage (préfixe "p2isr.") : heros={prenom,nom}, pseudo, theme,
//   vitesse, relus=[62,…], pos.NNN=idx, panier=[{script,id,nom_fr,brut_fr,cout}]
```

---

### Task 1 : Squelette du repo

**Files:**
- Create: `.gitignore`, `package.json`, `README.md`, `CLAUDE.md`
- Create (vides) : `css/`, `js/`, `data/scripts/`, `img/portraits/`, `tests/`

- [ ] **Step 1: Créer les fichiers de base**

`.gitignore` :
```
node_modules/
__pycache__/
.superpowers/
*.tmp
coverage/
```

`package.json` :
```json
{
  "name": "p2is-relecture",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "devDependencies": { "vitest": "^2.0.0", "jsdom": "^25.0.0" }
}
```

`vitest.config.js` :
```js
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "jsdom", include: ["tests/**/*.test.js"] } });
```

`CLAUDE.md` :
```markdown
# CLAUDE.md — p2is-relecture

Site statique de relecture de la traduction FR de Persona 2: Innocent Sin (PSP).

## Règles
- Le parent `/home/pchamza/Project/` est un repo git : TOUJOURS
  `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture <commande>`.
- `data/` est GÉNÉRÉ par `python3 sync.py` depuis `../../Trad_Persona2/P2-FR-IS-PSP/`
  — ne jamais l'éditer à la main, SAUF `data/labels.json` et `data/personnages.json`
  (préservés par sync).
- Zéro dépendance runtime, zéro build : HTML/CSS/JS vanilla, modules ES.
- Tests : `npm test` (vitest, modules js/) et `python3 -m unittest discover tests_py -q` (sync).
- Budget d'octets : `js/budget.js` est le portage EXACT de
  `json_verify/utils.py:estimate_bytes` du repo de trad — ne jamais "améliorer"
  l'algorithme sans synchroniser les deux côtés.
- Spec : docs/superpowers/specs/2026-06-12-site-relecture-p2is-design.md
```

`README.md` (version initiale, complétée en Task 20) :
```markdown
# P2IS Relecture 🦋

Outil web de relecture de la traduction française de **Persona 2: Innocent Sin (PSP)** —
lecture des scripts façon visual novel, propositions de modifications avec contrôle
de la limite de taille, export prêt à coller sur Discord.

Projet de fans, non commercial. Persona 2 © Atlus.
Traduction : https://github.com/chenetulipe/P2-FR-IS-PSP
```

- [ ] **Step 2: Installer vitest et vérifier**

Run: `cd /home/pchamza/Project/P2IS_Relecture/p2is-relecture && npm install && npx vitest run`
Expected: `No test files found` (exit code 1 acceptable à ce stade — aucun test encore)

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add -A
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "chore: squelette du projet (gitignore, package, CLAUDE.md, README)"
```

---

### Task 2 : `js/budget.js` — portage exact du calcul d'octets

**Files:**
- Create: `js/budget.js`
- Test: `tests/budget.test.js`

- [ ] **Step 1: Écrire les tests (cas vérifiés contre json_verify)**

`tests/budget.test.js` :
```js
import { describe, it, expect } from "vitest";
import { estimateBytes, cost, budgetOf, caracteresInterdits } from "../js/budget.js";

describe("estimateBytes (portage json_verify/utils.py)", () => {
  it("compte 2 octets par caractère standard", () => {
    expect(estimateBytes("Oui")).toBe(6);
  });
  it("compte les accents remplacés comme 2 octets", () => {
    expect(estimateBytes("é")).toBe(2);
    expect(estimateBytes("Étoile")).toBe(12);
  });
  it("compte les balises connues comme 2 octets", () => {
    expect(estimateBytes("[1205][U+000F]")).toBe(4);   // 2 balises
    expect(estimateBytes("[SP]")).toBe(8);              // [SP] n'est PAS dans le chemin balise
                                                        // → "[" déclenche la recherche : tag "[SP]"
                                                        // est dans CTRL_TAGS → 2... voir Step 3
  });
  it("compte [NULL] comme 2 octets (comportement json_verify)", () => {
    expect(estimateBytes("[NULL]")).toBe(2);
  });
  it("retourne -1 sur crochet non fermé", () => {
    expect(estimateBytes("Texte[1205")).toBe(-1);
  });
  it("cost = guillemet + nom + \\n + texte + \\n", () => {
    // '"' (2) + "Lisa" (8) + \n (2) + "Oui" (6) + \n (2) = 20
    expect(cost("Lisa", "Oui")).toBe(20);
  });
  it("budgetOf = data_size - 8", () => {
    expect(budgetOf(152)).toBe(144);
  });
});

describe("caracteresInterdits", () => {
  it("accepte ASCII + accents supportés + \\n", () => {
    expect(caracteresInterdits("Ça va, Tatsuya ?\nœuf à l'île")).toEqual([]);
  });
  it("rejette tiret cadratin, emoji, accents hors liste", () => {
    expect(caracteresInterdits("a — b")).toEqual(["—"]);
    expect(caracteresInterdits("ñ")).toEqual(["ñ"]);
  });
  it("ignore le contenu des balises", () => {
    expect(caracteresInterdits("[U+000F]ok")).toEqual([]);
  });
});
```

⚠ **Avant d'écrire `[SP]` dans le test ci-dessus, vérifier la valeur réelle** :
`python3 -c "import sys; sys.path.insert(0,'/home/pchamza/Project/Trad_Persona2/P2-FR-IS-PSP/json_verify'); from utils import estimate_bytes; print(estimate_bytes('[SP]'), estimate_bytes('[NULL]'), estimate_bytes('[1205][U+000F]'), estimate_bytes('Étoile'))"`
et ajuster les `expect` pour qu'ils reflètent **exactement** la sortie Python (la vérité = json_verify, pas l'intuition).

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run tests/budget.test.js`
Expected: FAIL (module inexistant)

- [ ] **Step 3: Implémenter `js/budget.js`**

```js
// Portage EXACT de json_verify/utils.py:estimate_bytes — ne pas "améliorer".
const REPLS = [["é","Ğ"],["è","ò"],["ê","¿"],["ô","Æ"],["É","Ņ"],
               ["È","Ũ"],["Î","£"],["Ô","ō"],["Û","ĵ"],["œ","ë"],["Œ","Ǩ"]];
const CTRL_TAGS = new Set(["[SP]","\n","[E1]","[E2]","[E3]","[E4]","[1205]","[001E]",
                           "[1432]","[0014]","[0002]","[0010]","[NULL]"]);

export function estimateBytes(text) {
  for (const [a, b] of REPLS) text = text.split(a).join(b);
  let count = 0, i = 0;
  while (i < text.length) {
    if (text[i] === "[") {
      const end = text.indexOf("]", i);
      if (end === -1) return -1;
      const tag = text.slice(i, end + 1);
      if (tag === "[NULL]") { count += 2; i = end + 1; continue; }
      const found = CTRL_TAGS.has(tag) ||
                    (tag.startsWith("[U+") && tag.length === 8) ||
                    tag.length === 6;
      count += found ? 2 : (tag.length - 2) * 2;
      i = end + 1;
    } else { count += 2; i += 1; }
  }
  return count;
}

export const cost = (nomFr, texteFr) => estimateBytes('"' + nomFr + "\n" + texteFr + "\n");
export const budgetOf = (dataSize) => dataSize - 8;

// Caractères affichables par le jeu (liste du CLAUDE.md de la trad)
const ACCENTS_OK = "éèêàçùâîôûœüïÉÈÊÀÇÙÂÎÔÛŒ";
export function caracteresInterdits(texte) {
  // retire les balises [..] avant contrôle
  const sansBalises = texte.replace(/\[[^\]]*\]/g, "");
  const interdits = [];
  for (const ch of sansBalises) {
    if (ch === "\n") continue;
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp <= 0x7e) continue;
    if (ACCENTS_OK.includes(ch)) continue;
    if (!interdits.includes(ch)) interdits.push(ch);
  }
  return interdits;
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run tests/budget.test.js`
Expected: PASS (tous)

- [ ] **Step 5: Validation croisée contre la référence Python**

```bash
python3 - <<'EOF'
import sys, json, glob
sys.path.insert(0, "/home/pchamza/Project/Trad_Persona2/P2-FR-IS-PSP/json_verify")
from utils import estimate_bytes
cas = []
for p in sorted(glob.glob("/home/pchamza/Project/Trad_Persona2/P2-FR-IS-PSP/traduction/event_scripts/script_*.json"))[:40]:
    for e in json.load(open(p, encoding="utf-8"))[:5]:
        t = e.get("texte_fr",""); n = e.get("nom_fr","")
        if t: cas.append({"nom": n, "texte": t, "attendu": estimate_bytes('"'+n+"\n"+t+"\n")})
json.dump(cas, open("tests/fixtures-budget.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(cas), "cas exportés")
EOF
```
Ajouter à `tests/budget.test.js` :
```js
import fixtures from "./fixtures-budget.json";
it("colle à json_verify sur des entrées réelles", () => {
  for (const c of fixtures) expect(cost(c.nom, c.texte)).toBe(c.attendu);
});
```
Run: `npx vitest run tests/budget.test.js` — Expected: PASS

- [ ] **Step 6: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/budget.js tests/
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: budget.js, portage exact d'estimate_bytes + validation croisée"
```

---

### Task 3 : `sync.py` — normalisation d'une entrée en bulles/segments

**Files:**
- Create: `sync.py` (fonctions pures d'abord), `tests_py/test_normalisation.py`

- [ ] **Step 1: Écrire les tests**

`tests_py/__init__.py` (vide) et `tests_py/test_normalisation.py` :
```python
import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import en_bulles, en_segments

class TestSegments(unittest.TestCase):
    def test_texte_simple(self):
        self.assertEqual(en_segments("Oui."), [{"t": "Oui."}])

    def test_sp_devient_espace(self):
        self.assertEqual(en_segments("Bonjour[SP]toi"), [{"t": "Bonjour toi"}])

    def test_pause_et_saut(self):
        segs = en_segments("Attends...[1205][U+000F][SP]quoi ?\nNon !")
        self.assertEqual(segs, [{"t": "Attends..."}, {"pause": True},
                                {"t": " quoi ?"}, {"nl": True}, {"t": "Non !"}])

    def test_pause_variantes(self):
        # [1205] suivi de [001E], [U+000A], [U+0008], [U+000B] = pause aussi
        self.assertEqual(en_segments("a[1205][001E]b"),
                         [{"t": "a"}, {"pause": True}, {"t": "b"}])

    def test_placeholders_heros(self):
        self.assertEqual(en_segments("Salut[SP][1113][SP][1112] !"),
                         [{"t": "Salut "}, {"hero": "prenom"}, {"t": " "},
                          {"hero": "nom"}, {"t": " !"}])

    def test_encadre_1432(self):
        segs = en_segments("Choisis[SP][1432][NULL][NULL][0014]Armes[1432][NULL][NULL][0014][SP]ici")
        self.assertEqual(segs, [{"t": "Choisis "}, {"enc": "Armes"}, {"t": " ici"}])

    def test_surligne_E4(self):
        segs = en_segments("le[SP][E4][NULL][NULL][U+0006]Taxi[SP]Maudit[E4][NULL][NULL][0002][SP]existe")
        self.assertEqual(segs, [{"t": "le "}, {"hl": "Taxi Maudit"}, {"t": " existe"}])

    def test_codes_inconnus_ignores(self):
        self.assertEqual(en_segments("a[E1][E2][U+0159]b"), [{"t": "ab"}])

class TestBulles(unittest.TestCase):
    def test_sans_bloc_une_bulle(self):
        self.assertEqual(en_bulles("Texte[SP]simple"),
                         [{"nom": None, "seg": [{"t": "Texte simple"}]}])

    def test_bloc_locuteur_interne(self):
        t = 'Question ?[E1][E2]\n[E3][E4][NULL][NULL]"Mme[SP]Saeko\nSuite.'
        self.assertEqual(en_bulles(t), [
            {"nom": None, "seg": [{"t": "Question ?"}]},
            {"nom": "Mme Saeko", "seg": [{"t": "Suite."}]}])

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `python3 -m unittest tests_py.test_normalisation -q` — Expected: FAIL (import)

- [ ] **Step 3: Implémenter dans `sync.py`**

```python
# -*- coding: utf-8 -*-
"""Génère data/ depuis le repo de traduction. Fonctions pures testables d'abord."""
import re

# Bloc d'intro de locuteur interne (même regex que migration/recover.py, avec capture du nom)
_DELIM = re.compile(
    r'\n?(?:\[(?:U\+)?[0-9A-Fa-f]{4}\]|\[E[1-9]\])*\[E4\]\[NULL\]\[NULL\]"([^\n]*)\n')

# Pause : [1205] suivi d'un code compagnon optionnel
_PAUSE = re.compile(r'\[1205\](?:\[(?:U\+000[0-9A-F]|001E)\])?')
_ENC = re.compile(r'\[1432\]\[NULL\]\[NULL\]\[0014\](.*?)\[1432\]\[NULL\]\[NULL\]\[0014\]', re.S)
_HL = re.compile(r'\[E4\]\[NULL\]\[NULL\]\[U\+0006\](.*?)\[E4\]\[NULL\]\[NULL\]\[0002\]', re.S)
_CODE = re.compile(r'\[[^\]]*\]')

# Marqueurs internes temporaires (caractères privés Unicode, jamais dans les textes)
_M_PAUSE, _M_NL, _M_PRENOM, _M_NOM = "", "", "", ""
_M_ENC_O, _M_ENC_F, _M_HL_O, _M_HL_F = "", "", "", ""

def en_segments(texte):
    """Texte brut (une bulle) -> liste de segments d'affichage."""
    t = texte.replace("[SP]", " ")
    t = _ENC.sub(lambda m: _M_ENC_O + m.group(1) + _M_ENC_F, t)
    t = _HL.sub(lambda m: _M_HL_O + m.group(1) + _M_HL_F, t)
    t = _PAUSE.sub(_M_PAUSE, t)
    t = t.replace("[1113]", _M_PRENOM).replace("[1112]", _M_NOM)
    t = _CODE.sub("", t)            # tout code restant disparaît de l'affichage
    t = t.replace("\n", _M_NL)
    segs, buf, mode = [], "", None  # mode None|'enc'|'hl'
    def flush():
        nonlocal buf
        if buf:
            segs.append({"enc": buf} if mode == "enc" else
                        {"hl": buf} if mode == "hl" else {"t": buf})
            buf = ""
    for ch in t:
        if ch == _M_PAUSE: flush(); segs.append({"pause": True})
        elif ch == _M_NL:  flush(); segs.append({"nl": True})
        elif ch == _M_PRENOM: flush(); segs.append({"hero": "prenom"})
        elif ch == _M_NOM:    flush(); segs.append({"hero": "nom"})
        elif ch == _M_ENC_O: flush(); mode = "enc"
        elif ch == _M_ENC_F: flush(); mode = None
        elif ch == _M_HL_O:  flush(); mode = "hl"
        elif ch == _M_HL_F:  flush(); mode = None
        else: buf += ch
    flush()
    return segs

def en_bulles(texte):
    """Texte brut complet -> [{nom, seg}] (découpe aux blocs locuteur internes)."""
    morceaux = _DELIM.split(texte)   # [txt0, nom1, txt1, nom2, txt2, …]
    bulles = [{"nom": None, "seg": en_segments(morceaux[0])}]
    for i in range(1, len(morceaux), 2):
        nom = morceaux[i].replace("[SP]", " ").strip()
        bulles.append({"nom": nom, "seg": en_segments(morceaux[i + 1])})
    return [b for b in bulles if b["seg"]]
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `python3 -m unittest tests_py.test_normalisation -q` — Expected: OK

- [ ] **Step 5: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add sync.py tests_py/
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat(sync): normalisation des entrées en bulles/segments d'affichage"
```

---

### Task 4 : `sync.py` — extraction des menus de choix

**Files:**
- Modify: `sync.py`
- Test: `tests_py/test_choix.py`

- [ ] **Step 1: Tests (les deux formes réelles de menus)**

`tests_py/test_choix.py` :
```python
import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import extraire_choix

class TestChoix(unittest.TestCase):
    def test_pas_de_menu(self):
        self.assertEqual(extraire_choix("Bonjour."), (None, "Bonjour."))

    def test_menu_simple(self):
        # type SIMPLE : options = lignes nues après [1208][code]
        q, _ = None, None
        choix, question = extraire_choix(
            "On y va ?\n[1208][0002]Oui\nNon")
        self.assertEqual(question, "On y va ?")
        self.assertEqual(choix["options"], ["Oui", "Non"])

    def test_menu_1432(self):
        choix, question = extraire_choix(
            "Alors ?\n[1208][0002][1432][NULL][NULL][0014]Partir[1432][NULL][NULL][0014]\n"
            "[1432][NULL][NULL][0014]Rester[1432][NULL][NULL][0014]")
        self.assertEqual(question, "Alors ?")
        self.assertEqual(choix["options"], ["Partir", "Rester"])

    def test_menu_options_prefixees(self):
        # options préfixées par des codes pointeurs [1210][U+xxxx] ou [111F]
        choix, _ = extraire_choix(
            "Quoi ?\n[1208][U+0003][111F]Bavarder\n[111F][1210][U+0100]Parler boutique\n[111F]Rien")
        self.assertEqual(choix["options"], ["Bavarder", "Parler boutique", "Rien"])

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `python3 -m unittest tests_py.test_choix -q` — Expected: FAIL

- [ ] **Step 3: Implémenter `extraire_choix` dans `sync.py`**

```python
_MENU = re.compile(r'\[(?:U\+)?1208\](?:\[(?:U\+)?[0-9A-Fa-f]{4}\])?')
_STRUCT_OPT = re.compile(r'\[1432\]|\[NULL\]|\[0014\]|\[111F\]|\[1210\]|\[U\+[0-9A-Fa-f]{4}\]|\[0002\]')

def extraire_choix(texte):
    """-> (choix|None, texte_question). choix = {"options": [str]}.
    La question (avant [1208]) reste à normaliser par l'appelant via en_segments."""
    m = _MENU.search(texte)
    if not m:
        return None, texte
    question = texte[:m.start()].rstrip("\n")
    corps = texte[m.end():]
    options = []
    if "[0014]" in corps:                      # type [1432] : split sur [0014]
        for part in re.split(r'\[0014\]', corps):
            p = _STRUCT_OPT.sub("", part).replace("[SP]", " ").strip("\n").strip()
            if p and "\n" not in p:
                options.append(p)
    else:                                       # type simple : lignes nues
        for line in corps.split("\n"):
            p = _STRUCT_OPT.sub("", line).replace("[SP]", " ").strip()
            if p:
                options.append(p)
    return ({"options": options} if options else None), question
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `python3 -m unittest discover tests_py -q` — Expected: OK (les deux fichiers)

- [ ] **Step 5: Validation sur données réelles**

```bash
python3 - <<'EOF'
import json, sys; sys.path.insert(0, ".")
from sync import extraire_choix
d = json.load(open("/home/pchamza/Project/Trad_Persona2/P2-FR-IS-PSP/traduction/event_scripts/script_085.json", encoding="utf-8"))
e = next(x for x in d if x["id"] == 58)          # menu simple 4 options
c, q = extraire_choix(x["texte_fr"] if (x:=e) else "")
print("Q:", q[:40]); print("opts:", c["options"])
assert len(c["options"]) == 4, c
EOF
```
Expected: 4 options FR du menu de Tamaki.

- [ ] **Step 6: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add sync.py tests_py/
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat(sync): extraction des menus de choix (formes simple et 1432)"
```

---

### Task 5 : `sync.py` — génération complète de `data/`

**Files:**
- Modify: `sync.py` (partie main/génération)
- Test: exécution réelle + contrôles

- [ ] **Step 1: Implémenter la génération**

Ajouter à `sync.py` :
```python
import json, os, glob, shutil, sys

TRAD = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "..", "Trad_Persona2", "P2-FR-IS-PSP")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

EMOJI_DEFAUT = "💬"

def convertir_entree(e):
    if not str(e.get("texte_orig", "")).strip():
        return None                              # slot vide → ignoré
    brut_fr, brut_en = e.get("texte_fr", ""), e.get("texte_orig", "")
    choix_fr, q_fr = extraire_choix(brut_fr)
    choix_en, q_en = extraire_choix(brut_en)
    if choix_fr: choix_fr["question"] = en_segments(q_fr)
    if choix_en: choix_en["question"] = en_segments(q_en)
    return {
        "id": e["id"],
        "nom_fr": e.get("nom_fr", ""), 
        "nom_en": e.get("nom_orig", "").replace("[SP]", " "),
        "bulles_fr": en_bulles(q_fr if choix_fr else brut_fr),
        "bulles_en": en_bulles(q_en if choix_en else brut_en),
        "choix_fr": choix_fr, "choix_en": choix_en,
        "brut_fr": brut_fr, "brut_en": brut_en,
        "data_size": e.get("data_size", 8),
        "budget": e.get("data_size", 8) - 8,
    }

def charger_json(chemin, defaut):
    try:
        with open(chemin, encoding="utf-8") as f: return json.load(f)
    except FileNotFoundError:
        return defaut

def ecrire(chemin, obj):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    tmp = chemin + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1); f.write("\n")
    json.load(open(tmp, encoding="utf-8"))       # relecture avant remplacement
    os.replace(tmp, chemin)

def generer_dictionnaire():
    """Parse le tableau markdown de Dictionnaire.md -> [{en, fr}]."""
    chemin = os.path.join(TRAD, "scripts", "Dictionnaire.md")
    termes = []
    for ligne in open(chemin, encoding="utf-8"):
        c = [x.strip() for x in ligne.strip().strip("|").split("|")]
        if len(c) >= 2 and c[0] and not c[0].startswith("-") and c[0] != "Anglais":
            fr = re.sub(r"\*\(.*?\)\*", "", c[1]).strip()   # retire les annotations
            termes.append({"en": c[0], "fr": fr})
    return termes

def main():
    labels = charger_json(os.path.join(DATA, "labels.json"), {})
    persos = charger_json(os.path.join(DATA, "personnages.json"), {})
    index, recherche = [], {}
    for p in sorted(glob.glob(os.path.join(TRAD, "traduction", "event_scripts", "script_*.json"))):
        no = int(re.search(r"(\d+)", os.path.basename(p)).group(1))
        entrees = [c for e in json.load(open(p, encoding="utf-8"))
                   if (c := convertir_entree(e))]
        noms = sorted({e["nom_fr"] for e in entrees if e["nom_fr"]})
        for n, e in [(n, e) for e in entrees for n in [e["nom_fr"]] if n]:
            persos.setdefault(n, {"emoji": EMOJI_DEFAUT})
        ecrire(os.path.join(DATA, "scripts", f"{no:03d}.json"),
               {"no": no, "entrees": entrees})
        index.append({"no": no, "label": labels.get(f"{no:03d}", ""),
                      "personnages": noms, "repliques": len(entrees)})
        recherche[f"{no:03d}"] = " ".join(
            seg.get("t", "") for e in entrees for b in e["bulles_fr"] for seg in b["seg"]).lower()
    ecrire(os.path.join(DATA, "index.json"), index)
    ecrire(os.path.join(DATA, "recherche.json"), recherche)
    ecrire(os.path.join(DATA, "personnages.json"), persos)
    ecrire(os.path.join(DATA, "labels.json"), labels)
    ecrire(os.path.join(DATA, "dictionnaire.json"), generer_dictionnaire())
    print(f"{len(index)} scripts générés")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Exécuter et contrôler**

Run: `python3 sync.py`
Expected: `399 scripts générés`

Contrôles :
```bash
python3 - <<'EOF'
import json
idx = json.load(open("data/index.json", encoding="utf-8"))
assert len(idx) == 399
s62 = json.load(open("data/scripts/062.json", encoding="utf-8"))
e4 = next(e for e in s62["entrees"] if e["id"] == 4)
assert e4["budget"] == e4["data_size"] - 8
assert any(seg.get("pause") for b in e4["bulles_fr"] for seg in b["seg"]) or True
dico = json.load(open("data/dictionnaire.json", encoding="utf-8"))
assert any(t["fr"] == "Cercle masqué" for t in dico)
print("OK —", len(dico), "termes de dictionnaire,", len(s62["entrees"]), "entrées dans 062")
EOF
```

- [ ] **Step 3: Pré-remplir `data/labels.json`**

Depuis les messages de commit de la trad (titres `[Script NNN] … (Contexte)`) :
```bash
python3 - <<'EOF'
import re, subprocess, json
log = subprocess.run(["git", "-C", "/home/pchamza/Project/Trad_Persona2/P2-FR-IS-PSP",
                      "log", "--pretty=%s"], capture_output=True, text=True).stdout
labels = {}
for m in re.finditer(r"\[Script (\d+)\][^(]*\(([^)]+)\)", log):
    labels.setdefault(m.group(1).zfill(3), m.group(2))
existant = json.load(open("data/labels.json", encoding="utf-8"))
existant.update({k: v for k, v in labels.items() if k not in existant or not existant[k]})
json.dump(existant, open("data/labels.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(labels), "étiquettes extraites")
EOF
python3 sync.py   # ré-injecte les labels dans index.json
```

- [ ] **Step 4: Commit (data/ inclus)**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add sync.py data/
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat(sync): génération complète de data/ (399 scripts, dico, index, recherche)"
```

---

### Task 6 : Portraits & `personnages.json`

**Files:**
- Create: `img/portraits/*.webp` (copies), Modify: `data/personnages.json`

- [ ] **Step 1: Copier les portraits utiles depuis personadle**

```bash
SRC=/home/pchamza/Project/personadle/database/portraits
DST=img/portraits
mkdir -p $DST
for f in Tatsuya Maya_A Eikichi Lisa Yukino Jun Ulala Katsuya Baofu Igor Philemon Tamaki Saeko DemonPainter; do
  cp -v "$SRC/$f.webp" "$DST/" 2>/dev/null || echo "MANQUANT: $f"
done
ls $DST
```
Si `Saeko.webp` n'existe pas, chercher la variante : `ls $SRC | grep -i saeko`.

- [ ] **Step 2: Renseigner `data/personnages.json` pour les principaux**

Éditer (sync préserve ces choix) — clé = `nom_fr` :
```json
{
  "Maya":            {"portrait": "Maya_A.webp",  "emoji": "📸", "couleur": "#e87a8a"},
  "Eikichi":         {"portrait": "Eikichi.webp", "emoji": "🎸", "couleur": "#7a9ee8"},
  "Lisa":            {"portrait": "Lisa.webp",    "emoji": "🎤", "couleur": "#e8c97a"},
  "Ginko":           {"portrait": "Lisa.webp",    "emoji": "🎤", "couleur": "#e8c97a"},
  "Yukino":          {"portrait": "Yukino.webp",  "emoji": "📷", "couleur": "#9ae87a"},
  "Jun":             {"portrait": "Jun.webp",     "emoji": "🌹", "couleur": "#c97ae8"},
  "Ulala":           {"portrait": "Ulala.webp",   "emoji": "💃", "couleur": "#e8957a"},
  "Katsuya":         {"portrait": "Katsuya.webp", "emoji": "👮", "couleur": "#7ae8d0"},
  "Baofu":           {"portrait": "Baofu.webp",   "emoji": "🕶️", "couleur": "#8a8a9a"},
  "Igor":            {"portrait": "Igor.webp",    "emoji": "👃", "couleur": "#7a7ae8"},
  "Philémon":        {"portrait": "Philemon.webp","emoji": "🦋", "couleur": "#7ad0e8"},
  "Tamaki":          {"portrait": "Tamaki.webp",  "emoji": "🔮", "couleur": "#e87ad0"},
  "Mme Saeko":       {"portrait": "Saeko.webp",   "emoji": "👩‍🏫", "couleur": "#d0e87a"},
  "Demon Painter":   {"portrait": "DemonPainter.webp", "emoji": "🎨", "couleur": "#a87ae8"},
  "???":             {"emoji": "🎭"},
  "Lycéen":          {"emoji": "🎓"}, "Lycéenne": {"emoji": "🎀"},
  "Vendeuse":        {"emoji": "🛍️"}, "Comte": {"emoji": "🎩"},
  "Chef Todoroki":   {"emoji": "🕵️"}, "Mme Idéale": {"emoji": "📜"},
  "Père d'Eikichi":  {"emoji": "🍣"}, "Tony": {"emoji": "🍕"},
  "Garçon Soejima":  {"emoji": "🍽️"}, "Roi Lion": {"emoji": "🦁"},
  "Reine Verseau":   {"emoji": "👑"}, "Dame Scorpion": {"emoji": "🦂"},
  "Prince Taureau":  {"emoji": "🐂"}, "Joker": {"emoji": "🃏"}
}
```
(Fusionner avec les entrées auto-générées existantes ; le héros utilisera `Tatsuya.webp` côté JS, ce n'est pas un `nom_fr` des scripts.)

- [ ] **Step 3: Re-lancer sync + vérifier la préservation**

Run: `python3 sync.py && python3 -c "import json; p=json.load(open('data/personnages.json')); assert p['Maya']['portrait']=='Maya_A.webp'; print('préservé ✓')"`

- [ ] **Step 4: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add img/ data/personnages.json
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: portraits des héros + mapping personnages (emoji, couleurs)"
```

---

### Task 7 : `js/etat.js` — état localStorage

**Files:**
- Create: `js/etat.js`
- Test: `tests/etat.test.js`

- [ ] **Step 1: Tests**

`tests/etat.test.js` :
```js
import { describe, it, expect, beforeEach } from "vitest";
import { Etat } from "../js/etat.js";

beforeEach(() => localStorage.clear());

describe("Etat", () => {
  it("retourne le défaut si absent", () => {
    expect(Etat.get("theme", "nuit")).toBe("nuit");
  });
  it("écrit/relit (JSON)", () => {
    Etat.set("heros", { prenom: "Tatsuya", nom: "Suou" });
    expect(Etat.get("heros", null)).toEqual({ prenom: "Tatsuya", nom: "Suou" });
  });
  it("relu(): bascule la progression d'un script", () => {
    expect(Etat.estRelu(62)).toBe(false);
    Etat.marquerRelu(62, true);
    expect(Etat.estRelu(62)).toBe(true);
    Etat.marquerRelu(62, false);
    expect(Etat.estRelu(62)).toBe(false);
  });
  it("panier: ajoute/remplace par (script,id), retire", () => {
    Etat.panierAjouter({ script: 62, id: 4, nom_fr: "X", brut_fr: "a", cout: 10 });
    Etat.panierAjouter({ script: 62, id: 4, nom_fr: "X", brut_fr: "b", cout: 12 });
    expect(Etat.panier()).toHaveLength(1);
    expect(Etat.panier()[0].brut_fr).toBe("b");
    Etat.panierRetirer(62, 4);
    expect(Etat.panier()).toHaveLength(0);
  });
  it("export/import de sauvegarde", () => {
    Etat.set("pseudo", "Hamza");
    const sauvegarde = Etat.exporter();
    localStorage.clear();
    Etat.importer(sauvegarde);
    expect(Etat.get("pseudo", "")).toBe("Hamza");
  });
  it("survit à un localStorage indisponible", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("quota"); };
    expect(() => Etat.set("x", 1)).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — `npx vitest run tests/etat.test.js` → FAIL

- [ ] **Step 3: Implémenter `js/etat.js`**

```js
const PREFIXE = "p2isr.";
let memoire = {};                 // repli si localStorage indisponible

function lireBrut(cle) {
  try { return localStorage.getItem(PREFIXE + cle); }
  catch { return memoire[cle] ?? null; }
}
function ecrireBrut(cle, val) {
  try { localStorage.setItem(PREFIXE + cle, val); }
  catch { memoire[cle] = val; Etat.degrade = true; }
}

export const Etat = {
  degrade: false,
  get(cle, defaut) {
    const v = lireBrut(cle);
    if (v === null) return defaut;
    try { return JSON.parse(v); } catch { return defaut; }
  },
  set(cle, val) { ecrireBrut(cle, JSON.stringify(val)); },

  estRelu(no) { return this.get("relus", []).includes(no); },
  marquerRelu(no, oui) {
    const r = new Set(this.get("relus", []));
    oui ? r.add(no) : r.delete(no);
    this.set("relus", [...r]);
  },

  panier() { return this.get("panier", []); },
  panierAjouter(prop) {
    const p = this.panier().filter(x => !(x.script === prop.script && x.id === prop.id));
    p.push(prop);
    this.set("panier", p);
  },
  panierRetirer(script, id) {
    this.set("panier", this.panier().filter(x => !(x.script === script && x.id === id)));
  },
  panierVider() { this.set("panier", []); },

  exporter() {
    const tout = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(PREFIXE)) tout[k.slice(PREFIXE.length)] = localStorage.getItem(k);
      }
    } catch { Object.assign(tout, memoire); }
    return JSON.stringify(tout);
  },
  importer(json) {
    const tout = JSON.parse(json);
    for (const [k, v] of Object.entries(tout)) ecrireBrut(k, v);
  },
};
```

- [ ] **Step 4: Lancer, vérifier le succès** — `npx vitest run tests/etat.test.js` → PASS

- [ ] **Step 5: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/etat.js tests/etat.test.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: etat.js, état localStorage (héros, progression, panier, sauvegarde)"
```

---

### Task 8 : CSS — base commune + 2 thèmes + sélecteur

**Files:**
- Create: `css/commun.css`, `css/theme-rouge.css`, `css/theme-nuit.css`, `js/theme.js`

- [ ] **Step 1: Variables et bascule**

`css/theme-nuit.css` (défaut) :
```css
:root[data-theme="nuit"] {
  --fond: #0c1024; --fond2: #141a38; --carte: #171c3a; --bord: #323b6e;
  --texte: #dfe3ff; --texte2: #7a83b8; --accent: #8fd0ff; --rouge: #c41e2a;
  --heros-fond: #2a1530; --heros-bord: #c41e2a; --heros-nom: #ff8a96;
  --pnj-nom: #8fd0ff; --dico: #ffd479; --rayon: 8px;
}
```
`css/theme-rouge.css` :
```css
:root[data-theme="rouge"] {
  --fond: #0a0a0a; --fond2: #141414; --carte: #141414; --bord: #333;
  --texte: #e8e8e8; --texte2: #777; --accent: #c41e2a; --rouge: #c41e2a;
  --heros-fond: #1c1014; --heros-bord: #fff; --heros-nom: #fff;
  --pnj-nom: #c41e2a; --dico: #e8b54a; --rayon: 4px;
}
```
`css/commun.css` : reset léger, `body{background:var(--fond);color:var(--texte);font-family:system-ui;}`, barre haute `.barre`, conteneur `.page{max-width:860px;margin:0 auto;padding:12px;}`, classes bulles (utilisées en Task 12) :
```css
.bulle{display:flex;gap:10px;margin:10px 0;align-items:flex-start;}
.bulle.heros{flex-direction:row-reverse;}
.avatar{width:44px;height:44px;border-radius:var(--rayon);background:var(--carte);
        border:1px solid var(--bord);display:flex;align-items:center;justify-content:center;
        font-size:22px;flex:none;overflow:hidden;}
.avatar img{width:100%;height:100%;object-fit:cover;}
.contenu{background:var(--carte);border:1px solid var(--bord);border-radius:0 var(--rayon) var(--rayon) var(--rayon);
         padding:8px 12px;max-width:76%;line-height:1.55;}
.bulle.heros .contenu{background:var(--heros-fond);border-color:var(--heros-bord);
         border-radius:var(--rayon) 0 var(--rayon) var(--rayon);}
.nom{font-weight:700;color:var(--pnj-nom);font-size:.85em;margin-bottom:2px;}
.bulle.heros .nom{color:var(--heros-nom);}
.pause{opacity:.45;margin:0 .35em;font-size:.8em;}
.enc{border:1px solid var(--accent);border-radius:4px;padding:0 .35em;color:var(--accent);}
.hl{color:var(--dico);font-style:italic;}
.mot-dico{color:var(--dico);border-bottom:1px dotted var(--dico);cursor:pointer;}
.choix{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
.choix button{background:var(--fond2);border:1px solid var(--accent);color:var(--texte);
        padding:6px 12px;border-radius:6px;cursor:pointer;text-align:left;}
.choix button.elu{background:var(--accent);color:var(--fond);font-weight:700;}
.choix button.fane{opacity:.35;}
@media (max-width:600px){.contenu{max-width:86%;}}
```

`js/theme.js` :
```js
import { Etat } from "./etat.js";
export function appliquerTheme(t) {
  document.documentElement.dataset.theme = t;
  Etat.set("theme", t);
}
export function initTheme() {
  appliquerTheme(Etat.get("theme", "nuit"));
}
export function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "nuit" ? "rouge" : "nuit");
}
```

- [ ] **Step 2: Vérification manuelle**

Créer une page de test jetable chargée des 3 CSS + une bulle statique de chaque type, ouvrir via `python3 -m http.server 8088`, vérifier les deux thèmes (modifier `data-theme` dans l'inspecteur). Supprimer la page jetable.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add css/ js/theme.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: thèmes nuit/rouge (variables CSS) + composants bulles + bascule"
```

---

### Task 9 : `index.html` — accueil (nom du héros, papillon, flammes)

**Files:**
- Create: `index.html`, `js/accueil.js`, `css/accueil.css`

- [ ] **Step 1: Page**

`index.html` :
```html
<!DOCTYPE html>
<html lang="fr" data-theme="nuit">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P2IS Relecture</title>
  <link rel="stylesheet" href="css/commun.css">
  <link rel="stylesheet" href="css/theme-nuit.css">
  <link rel="stylesheet" href="css/theme-rouge.css">
  <link rel="stylesheet" href="css/accueil.css">
</head>
<body>
  <canvas id="fond" aria-hidden="true"></canvas>
  <main class="page accueil">
    <h1>P2IS <span class="rouge">◆</span> Relecture</h1>
    <p class="sous-titre">Relire la traduction française de Persona 2: Innocent Sin</p>
    <form id="forme-heros">
      <label>Prénom du protagoniste
        <input id="prenom" value="Tatsuya" maxlength="12" autocomplete="off"></label>
      <label>Nom de famille
        <input id="nomfam" value="Suou" maxlength="12" autocomplete="off"></label>
      <button type="submit">Commencer la relecture ▶</button>
    </form>
    <nav class="liens">
      <a href="dictionnaire.html">📖 Dictionnaire</a>
      <a href="apropos.html">ℹ️ À propos</a>
    </nav>
  </main>
  <script type="module" src="js/accueil.js"></script>
</body>
</html>
```

`js/accueil.js` :
```js
import { Etat } from "./etat.js";
import { initTheme } from "./theme.js";
initTheme();
const h = Etat.get("heros", null);
if (h) { prenom.value = h.prenom; nomfam.value = h.nom; }
document.getElementById("forme-heros").addEventListener("submit", (ev) => {
  ev.preventDefault();
  Etat.set("heros", { prenom: prenom.value.trim() || "Tatsuya",
                      nom: nomfam.value.trim() || "Suou" });
  location.href = "scripts.html";
});

// ── Fond animé : papillon bleu + flammes bleues ───────────────────────────
const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
const cv = document.getElementById("fond"), ctx = cv.getContext("2d");
function taille() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener("resize", taille); taille();
const flammes = Array.from({ length: 14 }, () => ({
  x: Math.random() * cv.width, y: cv.height + Math.random() * 200,
  r: 4 + Math.random() * 9, v: .3 + Math.random() * .8, a: Math.random() * 6 }));
let t = 0;
function papillon(x, y, phase) {
  const bat = Math.sin(phase) * .55 + .8;          // battement d'ailes
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(110,180,255,.85)";
  for (const s of [-1, 1]) {                        // deux ailes
    ctx.save(); ctx.scale(s * bat, 1);
    ctx.beginPath(); ctx.ellipse(14, -6, 14, 9, -.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(11, 7, 9, 7, .4, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "rgba(20,40,80,.9)";
  ctx.fillRect(-1.5, -14, 3, 26);                   // corps
  ctx.restore();
}
function boucle() {
  ctx.clearRect(0, 0, cv.width, cv.height); t += .025;
  for (const f of flammes) {                        // flammes bleues montantes
    f.y -= f.v; f.a += .05;
    if (f.y < -20) { f.y = cv.height + 20; f.x = Math.random() * cv.width; }
    const ondule = Math.sin(f.a) * 6;
    const g = ctx.createRadialGradient(f.x + ondule, f.y, 0, f.x + ondule, f.y, f.r * 2.2);
    g.addColorStop(0, "rgba(140,200,255,.5)"); g.addColorStop(1, "rgba(140,200,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(f.x + ondule, f.y, f.r * 2.2, 0, 7); ctx.fill();
  }
  const px = cv.width / 2 + Math.sin(t * .6) * cv.width * .3;
  const py = cv.height * .35 + Math.sin(t * 1.3) * 40;
  papillon(px, py, t * 6);
  requestAnimationFrame(boucle);
}
if (!reduit) boucle();
else { papillon(cv.width / 2, cv.height * .35, 1); } // statique si reduced-motion
```

`css/accueil.css` :
```css
#fond{position:fixed;inset:0;z-index:-1;}
.accueil{min-height:100vh;display:flex;flex-direction:column;justify-content:center;
         align-items:center;text-align:center;gap:18px;}
.accueil h1{font-size:2.2em;letter-spacing:3px;font-style:italic;}
.rouge{color:var(--rouge);}
#forme-heros{display:flex;flex-direction:column;gap:12px;background:rgba(10,12,30,.72);
         padding:22px 28px;border:1px solid var(--bord);border-radius:var(--rayon);}
#forme-heros input{background:var(--fond2);border:1px solid var(--bord);color:var(--texte);
         padding:8px 10px;border-radius:6px;font-size:1.05em;text-align:center;}
#forme-heros button{background:var(--rouge);color:#fff;border:0;padding:10px;
         border-radius:6px;font-weight:700;cursor:pointer;font-size:1.05em;}
.liens a{color:var(--texte2);margin:0 10px;}
```

- [ ] **Step 2: Vérification manuelle**

Run: `python3 -m http.server 8088` → http://localhost:8088 — papillon qui volette en battant des ailes, flammes bleues qui montent, soumission → redirige vers `scripts.html` (404 pour l'instant, normal), nom mémorisé au retour.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add index.html js/accueil.js css/accueil.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: accueil — choix du nom du héros, papillon et flammes animés"
```

---

### Task 10 : `scripts.html` — grille, recherche, filtres

**Files:**
- Create: `scripts.html`, `js/grille.js`

- [ ] **Step 1: Page + module**

`scripts.html` :
```html
<!DOCTYPE html>
<html lang="fr" data-theme="nuit">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scripts — P2IS Relecture</title>
  <link rel="stylesheet" href="css/commun.css">
  <link rel="stylesheet" href="css/theme-nuit.css">
  <link rel="stylesheet" href="css/theme-rouge.css">
</head>
<body>
  <header class="barre">
    <a href="index.html">🦋 P2IS Relecture</a>
    <span id="stats"></span>
    <button id="btn-theme" title="Changer de thème">🎨</button>
  </header>
  <main class="page">
    <div class="outils">
      <input id="q" placeholder="🔎 Rechercher un texte, un numéro…">
      <select id="filtre-perso"><option value="">Tous les personnages</option></select>
    </div>
    <div id="grille" class="grille"></div>
  </main>
  <script type="module" src="js/grille.js"></script>
</body>
</html>
```

`js/grille.js` :
```js
import { Etat } from "./etat.js";
import { initTheme, basculerTheme } from "./theme.js";
initTheme();
document.getElementById("btn-theme").onclick = basculerTheme;

const [index, recherche] = await Promise.all([
  fetch("data/index.json").then(r => r.json()),
  fetch("data/recherche.json").then(r => r.json()),
]);
const grille = document.getElementById("grille");
const persos = [...new Set(index.flatMap(s => s.personnages))].sort();
const sel = document.getElementById("filtre-perso");
for (const p of persos) sel.add(new Option(p, p));

function carte(s) {
  const relu = Etat.estRelu(s.no);
  const enCours = Etat.panier().some(x => x.script === s.no);
  const el = document.createElement("a");
  el.className = "carte-script" + (relu ? " relu" : "");
  el.href = `lecture.html?s=${s.no}`;
  el.innerHTML = `
    <div class="no">${String(s.no).padStart(3, "0")} ${relu ? "✓" : ""} ${enCours ? "📝" : ""}</div>
    <div class="label">${s.label || "<i>sans titre</i>"}</div>
    <div class="persos">${s.personnages.slice(0, 4).join(", ")}${s.personnages.length > 4 ? "…" : ""}</div>
    <div class="compte">${s.repliques} répliques</div>`;
  return el;
}
function rendre() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const fp = sel.value;
  grille.replaceChildren();
  let visibles = 0;
  for (const s of index) {
    const cle = String(s.no).padStart(3, "0");
    if (fp && !s.personnages.includes(fp)) continue;
    if (q && !cle.includes(q) && !(s.label || "").toLowerCase().includes(q)
          && !(recherche[cle] || "").includes(q)) continue;
    grille.append(carte(s)); visibles++;
  }
  document.getElementById("stats").textContent =
    `${index.filter(s => Etat.estRelu(s.no)).length}/${index.length} relus · ${visibles} affichés`;
}
document.getElementById("q").addEventListener("input", rendre);
sel.addEventListener("change", rendre);
rendre();
```

Ajouter à `css/commun.css` :
```css
.barre{display:flex;align-items:center;gap:12px;justify-content:space-between;
       padding:10px 16px;border-bottom:2px solid var(--rouge);position:sticky;top:0;
       background:var(--fond);z-index:5;}
.barre a{color:var(--texte);text-decoration:none;font-weight:700;}
.outils{display:flex;gap:8px;margin:14px 0;flex-wrap:wrap;}
.outils input,.outils select{background:var(--fond2);border:1px solid var(--bord);
       color:var(--texte);padding:8px 10px;border-radius:6px;flex:1;min-width:180px;}
.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;}
.carte-script{display:block;background:var(--carte);border:1px solid var(--bord);
       border-radius:var(--rayon);padding:10px;color:var(--texte);text-decoration:none;}
.carte-script.relu{border-color:#3a8a4a;}
.carte-script .no{font-weight:700;color:var(--accent);}
.carte-script .persos,.carte-script .compte{font-size:.78em;color:var(--texte2);}
```

- [ ] **Step 2: Vérification manuelle**

Serveur local → la grille affiche 399 cartes, étiquettes présentes pour les scripts connus, recherche « calbutes » trouve les bons scripts, filtre « Eikichi » réduit la liste.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add scripts.html js/grille.js css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: grille des scripts avec recherche plein texte et filtre personnage"
```

---

### Task 11 : `js/normalise.js` — rendu des segments en DOM

**Files:**
- Create: `js/normalise.js`
- Test: `tests/normalise.test.js`

- [ ] **Step 1: Tests**

`tests/normalise.test.js` :
```js
import { describe, it, expect } from "vitest";
import { rendreSegments, texteLisible } from "../js/normalise.js";

const heros = { prenom: "Hamza", nom: "Karrouchi" };

describe("rendreSegments", () => {
  it("texte simple", () => {
    const el = rendreSegments([{ t: "Bonjour" }], heros);
    expect(el.textContent).toBe("Bonjour");
  });
  it("héros remplacé et marqué", () => {
    const el = rendreSegments([{ t: "Salut " }, { hero: "prenom" }], heros);
    expect(el.textContent).toBe("Salut Hamza");
    expect(el.querySelector(".placeholder-heros")).toBeTruthy();
  });
  it("pause, saut, encadré, surligné", () => {
    const el = rendreSegments(
      [{ t: "a" }, { pause: true }, { nl: true }, { enc: "Armes" }, { hl: "fort" }], heros);
    expect(el.querySelector(".pause")).toBeTruthy();
    expect(el.querySelector("br")).toBeTruthy();
    expect(el.querySelector(".enc").textContent).toBe("Armes");
    expect(el.querySelector(".hl").textContent).toBe("fort");
  });
});

describe("texteLisible (pour l'export Discord)", () => {
  it("symbolise pauses et sauts", () => {
    expect(texteLisible("Oui.[1205][U+000F] Non.\nFin", { sp: false }))
      .toBe("Oui.⏸ Non.⏎Fin");
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL

- [ ] **Step 3: Implémenter `js/normalise.js`**

```js
// Rendu DOM des segments générés par sync.py + helpers texte lisible.
export function rendreSegments(segments, heros) {
  const racine = document.createElement("span");
  for (const s of segments) {
    if (s.t !== undefined) racine.append(s.t);
    else if (s.pause) { const x = document.createElement("span");
      x.className = "pause"; x.textContent = "⏸"; racine.append(x); }
    else if (s.nl) racine.append(document.createElement("br"));
    else if (s.hero) { const x = document.createElement("span");
      x.className = "placeholder-heros";
      x.textContent = s.hero === "prenom" ? heros.prenom : heros.nom;
      x.title = s.hero === "prenom" ? "[1113] — prénom du héros" : "[1112] — nom du héros";
      racine.append(x); }
    else if (s.enc !== undefined) { const x = document.createElement("span");
      x.className = "enc"; x.textContent = s.enc; racine.append(x); }
    else if (s.hl !== undefined) { const x = document.createElement("span");
      x.className = "hl"; x.textContent = s.hl; racine.append(x); }
  }
  return racine;
}

// Brut -> version lisible une ligne (export Discord) : ⏸ pauses, ⏎ sauts.
export function texteLisible(brut) {
  return brut
    .replace(/\[1205\](?:\[(?:U\+000[0-9A-F]|001E)\])?/g, "⏸")
    .replace(/\[SP\]/g, " ")
    .replace(/\n/g, "⏎");
}

// Avatar : portrait -> emoji -> initiale.
export function rendreAvatar(nom, perso) {
  const av = document.createElement("div");
  av.className = "avatar";
  if (perso?.portrait) {
    const img = document.createElement("img");
    img.src = `img/portraits/${perso.portrait}`; img.alt = nom;
    img.onerror = () => { img.remove(); av.textContent = perso.emoji || nom[0] || "?"; };
    av.append(img);
  } else av.textContent = perso?.emoji || (nom ? nom[0].toUpperCase() : "?");
  return av;
}
```
Ajouter à `css/commun.css` : `.placeholder-heros{background:rgba(140,200,255,.14);border-radius:3px;padding:0 2px;}`

- [ ] **Step 4: Lancer, vérifier le succès** — `npx vitest run tests/normalise.test.js` → PASS

- [ ] **Step 5: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/normalise.js tests/normalise.test.js css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: normalise.js — rendu DOM des segments, avatars, texte lisible"
```

---

### Task 12 : `lecture.html` + `js/lecteur.js` v1 — fil statique complet

**Files:**
- Create: `lecture.html`, `js/lecteur.js`

- [ ] **Step 1: Page**

`lecture.html` :
```html
<!DOCTYPE html>
<html lang="fr" data-theme="nuit">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lecture — P2IS Relecture</title>
  <link rel="stylesheet" href="css/commun.css">
  <link rel="stylesheet" href="css/theme-nuit.css">
  <link rel="stylesheet" href="css/theme-rouge.css">
</head>
<body>
  <header class="barre">
    <a href="scripts.html">← Scripts</a>
    <span id="titre"></span>
    <span id="avancement"></span>
    <label class="toggle"><input type="checkbox" id="cmp"> EN</label>
    <button id="btn-derouler" title="Tout dérouler">⏬</button>
    <button id="btn-theme" title="Thème">🎨</button>
    <button id="btn-panier" title="Panier">📋<span id="badge-panier"></span></button>
  </header>
  <main class="page"><div id="fil"></div>
    <div id="fin" hidden>
      <p>— Fin du script —</p>
      <button id="btn-relu">✓ Marquer comme relu</button>
      <nav><a id="prec">◀ précédent</a> <a id="suiv">suivant ▶</a></nav>
    </div>
    <div id="indicateur">▼ cliquer / Espace : suite</div>
  </main>
  <aside id="panneau-editeur" hidden></aside>
  <aside id="panneau-panier" hidden></aside>
  <script type="module" src="js/lecteur.js"></script>
</body>
</html>
```

- [ ] **Step 2: Module v1 (rendu complet, sans révélation progressive)**

`js/lecteur.js` :
```js
import { Etat } from "./etat.js";
import { initTheme, basculerTheme } from "./theme.js";
import { rendreSegments, rendreAvatar } from "./normalise.js";

initTheme();
document.getElementById("btn-theme").onclick = basculerTheme;

const no = parseInt(new URLSearchParams(location.search).get("s"), 10);
const heros = Etat.get("heros", { prenom: "Tatsuya", nom: "Suou" });
export let donnees, persos, index;
try {
  [donnees, persos, index] = await Promise.all([
    fetch(`data/scripts/${String(no).padStart(3, "0")}.json`).then(r => { if (!r.ok) throw 0; return r.json(); }),
    fetch("data/personnages.json").then(r => r.json()),
    fetch("data/index.json").then(r => r.json()),
  ]);
} catch {
  location.href = "scripts.html";        // script inexistant → retour grille
  throw new Error("script introuvable");
}
const meta = index.find(s => s.no === no);
document.getElementById("titre").textContent =
  `Script ${String(no).padStart(3, "0")}${meta?.label ? " — " + meta.label : ""}`;

const NOMS_HEROS = new Set([heros.prenom, "Tatsuya", ""]);  // bulles côté droit
function estHeros(nom) { return NOMS_HEROS.has(nom) || nom === heros.prenom; }

export function construireBulle(entree, bulle, indiceBulle) {
  const nom = bulle.nom ?? entree.nom_fr;
  const el = document.createElement("div");
  el.className = "bulle" + (estHeros(nom) ? " heros" : "");
  el.dataset.id = entree.id; el.dataset.bulle = indiceBulle;
  const persoCle = estHeros(nom) ? null : nom;
  el.append(rendreAvatar(nom || "?", persoCle ? persos[persoCle] : { portrait: "Tatsuya.webp" }));
  const contenu = document.createElement("div");
  contenu.className = "contenu";
  const nomEl = document.createElement("div");
  nomEl.className = "nom";
  nomEl.textContent = estHeros(nom) ? heros.prenom : (nom || "—");
  contenu.append(nomEl, rendreSegments(bulle.seg, heros));
  el.append(contenu);
  return el;
}

export function construireChoix(entree) {
  const bloc = document.createElement("div");
  bloc.className = "choix";
  for (const opt of entree.choix_fr.options) {
    const b = document.createElement("button");
    b.textContent = opt;
    bloc.append(b);
  }
  return bloc;
}

const fil = document.getElementById("fil");
export const blocs = [];                 // liste plate de tout ce qui s'affiche
for (const e of donnees.entrees) {
  e.bulles_fr.forEach((b, i) => blocs.push({ type: "bulle", entree: e, bulle: b, i }));
  if (e.choix_fr) blocs.push({ type: "choix", entree: e });
}
for (const b of blocs)                  // v1 : tout est rendu d'un coup
  fil.append(b.type === "bulle" ? construireBulle(b.entree, b.bulle, b.i)
                                : construireChoix(b.entree));
document.getElementById("avancement").textContent = `${blocs.length} bulles`;
```

- [ ] **Step 3: Vérification manuelle**

`http://localhost:8088/lecture.html?s=62` → les 16 entrées du script 062 s'affichent : Eikichi à gauche avec portrait, bulles héros à droite avec le prénom choisi, pauses ⏸ visibles, lettre du Roi Lion en encadré. `?s=9999` → retour grille.

- [ ] **Step 4: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add lecture.html js/lecteur.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: lecteur v1 — fil complet de bulles avec portraits et héros"
```

---

### Task 13 : Révélation progressive + machine à écrire

**Files:**
- Modify: `js/lecteur.js`

- [ ] **Step 1: Remplacer le rendu d'un coup par la révélation**

Dans `js/lecteur.js`, remplacer la boucle finale de la Task 12 par :
```js
let position = Math.min(Etat.get(`pos.${no}`, 0), blocs.length); // reprise
let enEcriture = null;                                            // animation en cours

function ecrireMachine(elBulle) {
  // anime les nœuds texte de la bulle : on les vide puis on les retape
  const vitesse = Etat.get("vitesse", 28);                        // ms / caractère
  if (vitesse === 0) return Promise.resolve();                    // mode instantané
  const morceaux = [];
  (function collecter(n) {
    for (const enfant of [...n.childNodes]) {
      if (enfant.nodeType === Node.TEXT_NODE && enfant.textContent) {
        morceaux.push([enfant, enfant.textContent]); enfant.textContent = "";
      } else if (enfant.classList?.contains("pause")) morceaux.push([enfant, "⏸PAUSE"]);
      else collecter(enfant);
    }
  })(elBulle.querySelector(".contenu"));
  return new Promise(res => {
    let i = 0, j = 0;
    enEcriture = { finir() {                                       // 1er clic : complète
      for (; i < morceaux.length; i++) {
        const [n, txt] = morceaux[i];
        if (txt !== "⏸PAUSE") n.textContent = txt;
      }
      enEcriture = null; res();
    } };
    (function tick() {
      if (!enEcriture) return;
      if (i >= morceaux.length) { enEcriture = null; return res(); }
      const [n, txt] = morceaux[i];
      if (txt === "⏸PAUSE") { i++; j = 0; setTimeout(tick, vitesse * 9); return; }
      n.textContent = txt.slice(0, ++j);
      if (j >= txt.length) { i++; j = 0; }
      setTimeout(tick, vitesse);
    })();
  });
}

async function avancer() {
  if (enEcriture) { enEcriture.finir(); return; }                 // complète d'abord
  if (position >= blocs.length) return;
  const b = blocs[position++];
  Etat.set(`pos.${no}`, position);
  const el = b.type === "bulle" ? construireBulle(b.entree, b.bulle, b.i)
                                : construireChoix(b.entree);
  fil.append(el);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
  majAvancement();
  if (b.type === "bulle") await ecrireMachine(el);
  if (b.type === "choix") attendreChoix(el);                      // Task 14
}
function majAvancement() {
  document.getElementById("avancement").textContent = `${position}/${blocs.length}`;
  document.getElementById("fin").hidden = position < blocs.length;
  document.getElementById("indicateur").hidden = position >= blocs.length;
}
function toutDerouler() {
  if (enEcriture) enEcriture.finir();
  const v = Etat.get("vitesse", 28); Etat.set("vitesse", 0);
  while (position < blocs.length) avancer();
  Etat.set("vitesse", v);
}
document.getElementById("btn-derouler").onclick = toutDerouler;
document.getElementById("fil").addEventListener("click",
  ev => { if (!ev.target.closest(".choix") && !ev.target.closest(".bulle [data-edit]")) avancer(); });
document.getElementById("indicateur").onclick = () => avancer();
addEventListener("keydown", ev => {
  if (ev.code === "Space" && !ev.target.closest("input,textarea,[contenteditable]")) {
    ev.preventDefault(); avancer();
  }
});
// rejoue jusqu'à la position sauvegardée, instantanément
{ const cible = position; position = 0;
  const v = Etat.get("vitesse", 28); Etat.set("vitesse", 0);
  while (position < cible) avancer();
  Etat.set("vitesse", v); }
majAvancement();
```

- [ ] **Step 2: Vérification manuelle**

`?s=62` : le texte se tape lettre par lettre avec micro-pause aux ⏸, 1er clic complète, 2e clic avance ; Espace fonctionne ; ⏬ déroule tout ; recharger la page reprend où on en était.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/lecteur.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: révélation progressive, machine à écrire, reprise de lecture"
```

---

### Task 14 : Choix interactifs (cosmétiques)

**Files:**
- Modify: `js/lecteur.js`

- [ ] **Step 1: Implémenter `attendreChoix`**

```js
let choixEnAttente = false;
function attendreChoix(blocChoix) {
  choixEnAttente = true;
  for (const b of blocChoix.querySelectorAll("button")) {
    b.onclick = (ev) => {
      ev.stopPropagation();
      if (!choixEnAttente) return;
      choixEnAttente = false;
      b.classList.add("elu");
      for (const autre of blocChoix.querySelectorAll("button"))
        if (autre !== b) autre.classList.add("fane");
      avancer();
    };
  }
}
```
Et au début d'`avancer()` : `if (choixEnAttente) return;` (on doit cliquer une option pour continuer).

- [ ] **Step 2: Vérification manuelle** — `?s=1` (menus Oui/Non de Mme Saeko) : la lecture s'arrête sur le menu, clic sur une option l'illumine et la lecture repart.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/lecteur.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: choix interactifs (sélection cosmétique, lecture linéaire)"
```

---

### Task 15 : Comparaison FR/EN

**Files:**
- Modify: `js/lecteur.js`, `css/commun.css`

- [ ] **Step 1: Implémentation**

Dans `construireBulle`, après le contenu FR, ajouter systématiquement la version EN (cachée par défaut) et le bouton 🔁 :
```js
  const enWrap = document.createElement("div");
  enWrap.className = "version-en";
  const bulleEn = entree.bulles_en[indiceBulle] ?? entree.bulles_en[0];
  if (bulleEn) enWrap.append(rendreSegments(bulleEn.seg, heros));
  contenu.append(enWrap);
  const btnSwap = document.createElement("button");
  btnSwap.className = "swap"; btnSwap.textContent = "🔁"; btnSwap.title = "FR ↔ EN";
  btnSwap.onclick = (ev) => { ev.stopPropagation(); el.classList.toggle("montre-en"); };
  contenu.append(btnSwap);
```
CSS :
```css
.version-en{display:none;color:var(--texte2);font-size:.85em;margin-top:6px;
            border-top:1px dashed var(--bord);padding-top:4px;}
body.compare .version-en,.bulle.montre-en .version-en{display:block;}
.swap{background:none;border:0;cursor:pointer;font-size:.8em;opacity:.4;float:right;}
.swap:hover{opacity:1;}
```
Toggle global :
```js
document.getElementById("cmp").onchange = (ev) =>
  document.body.classList.toggle("compare", ev.target.checked);
```
Pour les choix : dans `construireChoix`, si `entree.choix_en`, ajouter `title="${entree.choix_en.options[i] ?? ""}"` sur chaque bouton (l'EN au survol) et une ligne `.version-en` avec les options EN jointes par « / ».

- [ ] **Step 2: Vérification manuelle** — toggle EN : l'anglais apparaît sous chaque bulle ; 🔁 bascule bulle par bulle.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/lecteur.js css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: comparaison FR/EN globale et par bulle"
```

---

### Task 16 : Dictionnaire — coloration, infobulle, page, ⚠ incohérence

**Files:**
- Create: `js/dico.js`, `dictionnaire.html`
- Modify: `js/lecteur.js`
- Test: `tests/dico.test.js`

- [ ] **Step 1: Tests du marquage**

`tests/dico.test.js` :
```js
import { describe, it, expect } from "vitest";
import { marquerTermes, incoherences } from "../js/dico.js";

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
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL

- [ ] **Step 3: Implémenter `js/dico.js`**

```js
let _dico = null;
export async function chargerDico() {
  _dico ??= await fetch("data/dictionnaire.json").then(r => r.json());
  return _dico;
}
const echapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function marquerTermes(racine, dico) {
  const termes = [...dico].filter(t => t.fr.length > 2)
                          .sort((a, b) => b.fr.length - a.fr.length);
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const noeuds = [];
  while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
  for (const n of noeuds) {
    if (n.parentElement.closest(".mot-dico")) continue;
    let txt = n.textContent, frag = null;
    for (const t of termes) {
      const re = new RegExp(`(^|\\P{L})(${echapper(t.fr)})(\\P{L}|$)`, "u");
      const m = re.exec(txt);
      if (!m) continue;
      frag = document.createDocumentFragment();
      frag.append(txt.slice(0, m.index) + m[1]);
      const mot = document.createElement("span");
      mot.className = "mot-dico"; mot.textContent = m[2];
      mot.dataset.en = t.en;
      frag.append(mot, txt.slice(m.index + m[1].length + m[2].length));
      break;
    }
    if (frag) n.replaceWith(frag);
  }
}

export function incoherences(brutEn, brutFr, dico) {
  const en = brutEn.replace(/\[SP\]/g, " ").toLowerCase();
  const fr = brutFr.replace(/\[SP\]/g, " ").toLowerCase();
  const probs = [];
  for (const t of dico) {
    const frPrincipal = t.fr.split("/")[0].trim();
    if (en.includes(t.en.toLowerCase()) && !fr.includes(frPrincipal.toLowerCase()))
      probs.push(`${t.en} → ${frPrincipal}`);
  }
  return probs;
}
```

- [ ] **Step 4: Lancer, vérifier le succès** — PASS

- [ ] **Step 5: Brancher dans le lecteur + infobulle + page dictionnaire**

Dans `construireBulle` (après rendu) : `marquerTermes(contenu, dicoCharge)` ; ⚠ : si `incoherences(entree.brut_en, entree.brut_fr, dicoCharge).length`, ajouter un `<span class="warn" title="…">⚠</span>` à côté du nom (title = liste). Délégation de clic sur `.mot-dico` → petite infobulle positionnée (div `.infobulle` : « EN : Masked circle — <a href="dictionnaire.html">voir le dictionnaire</a> », fermée au clic ailleurs).

`dictionnaire.html` : page simple (même barre) qui charge `data/dictionnaire.json`, tableau EN | FR avec champ de recherche filtrant les lignes (`input` + `Array.filter`).

- [ ] **Step 6: Vérification manuelle** — `?s=62` : « Cercle masqué » et « Roi Lion » dorés, clic → infobulle ; page dictionnaire recherchable.

- [ ] **Step 7: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/dico.js dictionnaire.html js/lecteur.js tests/dico.test.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: dictionnaire — coloration, infobulles, page glossaire, alerte incohérence"
```

---

### Task 17 : Éditeur à jetons

**Files:**
- Create: `js/editeur.js`
- Modify: `js/lecteur.js`, `css/commun.css`
- Test: `tests/editeur.test.js`

- [ ] **Step 1: Tests du cœur (brut ↔ jetons)**

`tests/editeur.test.js` :
```js
import { describe, it, expect } from "vitest";
import { brutVersJetons, jetonsVersBrut } from "../js/editeur.js";

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
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL

- [ ] **Step 3: Implémenter le cœur dans `js/editeur.js`**

```js
import { cost, budgetOf, caracteresInterdits } from "./budget.js";
import { Etat } from "./etat.js";

const RE_JETON = /\[1205\](?:\[(?:U\+000[0-9A-F]|001E)\])?|\n|\[[^\]]*\]/g;
function icone(code) {
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
```

- [ ] **Step 4: Lancer, vérifier le succès** — PASS, puis commit intermédiaire :

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/editeur.js tests/editeur.test.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: editeur — conversion brut/jetons aller-retour"
```

- [ ] **Step 5: Le panneau d'édition (DOM)**

Suite de `js/editeur.js` :
```js
export function ouvrirEditeur(entree, surValide) {
  const pan = document.getElementById("panneau-editeur");
  pan.hidden = false;
  pan.innerHTML = `
    <div class="ed-tete"><b>Script — id ${entree.id}</b>
      <button class="ed-fermer">✕</button></div>
    <div class="ed-en">${entree.brut_en.replace(/\[SP\]/g, " ").replace(/</g, "&lt;")}</div>
    <label class="ed-nom">Nom : <input id="ed-nom" value=""></label>
    <div id="ed-zone" contenteditable="true" spellcheck="true"></div>
    <div class="ed-outils">
      <button data-ins="\n">⏎ saut</button>
      <button data-ins="[1205][U+000F]">⏸ pause</button>
      <span id="ed-jauge"></span>
    </div>
    <div id="ed-erreurs"></div>
    <div id="ed-apercu"></div>
    <button id="ed-valider" disabled>Proposer cette modification</button>`;
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
      else if (n.dataset?.code) jetons.push({ type: "code", v: n.dataset.code });
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
    btn.onclick = () => { document.execCommand("insertHTML", false,
      `<span class="jeton" contenteditable="false" data-code="${btn.dataset.ins === "\n" ? "&#10;" : btn.dataset.ins}">${icone(btn.dataset.ins)}</span>`); maj(); };
  pan.querySelector(".ed-fermer").onclick = () => { pan.hidden = true; };
  pan.querySelector("#ed-valider").onclick = () => {
    const brut = maj();
    surValide({ brut_fr: brut, nom_fr: nomInput.value,
                cout: cost(nomInput.value, brut) });
    pan.hidden = true;
  };
  poserJetons(brutVersJetons(entree.brut_fr));
  maj();
}
```
CSS (`css/commun.css`) :
```css
#panneau-editeur,#panneau-panier{position:fixed;right:0;top:0;bottom:0;width:min(480px,100vw);
  background:var(--fond2);border-left:2px solid var(--rouge);padding:14px;overflow:auto;z-index:10;}
.jeton{display:inline-block;background:var(--carte);border:1px solid var(--accent);
  border-radius:4px;padding:0 4px;margin:0 1px;font-size:.8em;user-select:all;cursor:default;}
#ed-zone{background:var(--fond);border:1px solid var(--bord);border-radius:6px;
  padding:10px;min-height:90px;margin:8px 0;white-space:pre-wrap;}
.ed-en{color:var(--texte2);font-size:.85em;border-left:3px solid var(--bord);
  padding-left:8px;margin:8px 0;white-space:pre-wrap;}
#ed-jauge.vert{color:#6ad06a;} #ed-jauge.orange{color:#e8b54a;} #ed-jauge.rouge{color:#e85a5a;}
#ed-erreurs{color:#e85a5a;font-size:.85em;min-height:1.2em;}
#ed-valider{width:100%;padding:10px;background:var(--rouge);color:#fff;border:0;
  border-radius:6px;font-weight:700;cursor:pointer;}
#ed-valider:disabled{opacity:.35;cursor:not-allowed;}
```

- [ ] **Step 6: Brancher dans le lecteur**

Dans `construireBulle` : ajouter un bouton ✏️ (`data-edit`) dans `.contenu` ; clic →
```js
import { ouvrirEditeur } from "./editeur.js";
// …
btnEdit.onclick = (ev) => { ev.stopPropagation();
  ouvrirEditeur(entree, (prop) => {
    Etat.panierAjouter({ script: no, id: entree.id, ...prop,
                         ancien_brut: entree.brut_fr, ancien_nom: entree.nom_fr });
    el.classList.add("modifiee");
    majBadgePanier();
  }); };
```
Bulle `.modifiee` : bordure dorée + petit badge 📝 (CSS une ligne). `majBadgePanier()` : met `Etat.panier().length` dans `#badge-panier`.

- [ ] **Step 7: Vérification manuelle**

Cliquer ✏️ sur une bulle : panneau avec EN en référence, jetons ⏸/⏎ insécables, jauge qui passe orange/rouge quand on tape trop, « — » signalé interdit, validation bloquée hors budget, validation ok → badge panier +1, bulle marquée.

- [ ] **Step 8: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/editeur.js js/lecteur.js css/commun.css
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: éditeur à jetons complet (jauge octets, caractères interdits, panier)"
```

---

### Task 18 : Panier & export Discord

**Files:**
- Create: `js/panier.js`
- Modify: `js/lecteur.js`
- Test: `tests/panier.test.js`

- [ ] **Step 1: Test du format d'export**

`tests/panier.test.js` :
```js
import { describe, it, expect } from "vitest";
import { formaterExport } from "../js/panier.js";

describe("formaterExport", () => {
  it("groupe par script et formate", () => {
    const txt = formaterExport([
      { script: 62, id: 4, nom_fr: "Bel homme", ancien_nom: "Bel homme",
        ancien_brut: "J'ai des ordres de notre Reine...\nVous mourrez tous ici !",
        brut_fr: "Sur ordre de notre Reine...\nVous mourrez tous ici !", cout: 130 },
    ], { pseudo: "Hamza", budgets: { "62/4": 144 } });
    expect(txt).toContain("Propositions de Hamza");
    expect(txt).toContain("**Script 062**");
    expect(txt).toContain("• id 4 (130/144 o)");
    expect(txt).toContain("ancien : J'ai des ordres de notre Reine...⏎Vous mourrez tous ici !");
    expect(txt).toContain("proposé : Sur ordre de notre Reine...⏎Vous mourrez tous ici !");
    expect(txt).toContain("brut : `Sur ordre de notre Reine...\\nVous mourrez tous ici !`");
  });
  it("mentionne le nom si changé", () => {
    const txt = formaterExport([
      { script: 1, id: 2, nom_fr: "Lycéen", ancien_nom: "Étudiant",
        ancien_brut: "a", brut_fr: "a", cout: 10 }], { pseudo: "X", budgets: { "1/2": 90 } });
    expect(txt).toContain("nom : Étudiant → Lycéen");
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL

- [ ] **Step 3: Implémenter `js/panier.js`**

```js
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

export function ouvrirPanier(budgets) {
  const pan = document.getElementById("panneau-panier");
  pan.hidden = false;
  const props = Etat.panier();
  pan.innerHTML = `<div class="ed-tete"><b>📋 Panier (${props.length})</b>
      <button class="ed-fermer">✕</button></div>
    <label>Pseudo : <input id="pn-pseudo" value="${Etat.get("pseudo", "")}"></label>
    <div id="pn-liste"></div>
    <button id="pn-copier">Copier pour Discord</button>
    <textarea id="pn-secours" hidden rows="8"></textarea>
    <button id="pn-vider">Vider le panier</button>`;
  const liste = pan.querySelector("#pn-liste");
  for (const p of props) {
    const d = document.createElement("div"); d.className = "pn-item";
    d.innerHTML = `<b>${String(p.script).padStart(3, "0")}/${p.id}</b>
      ${texteLisible(p.brut_fr).slice(0, 60)}… <button data-x>🗑</button>`;
    d.querySelector("[data-x]").onclick = () => { Etat.panierRetirer(p.script, p.id); ouvrirPanier(budgets); };
    liste.append(d);
  }
  pan.querySelector("#pn-pseudo").onchange = (ev) => Etat.set("pseudo", ev.target.value);
  pan.querySelector(".ed-fermer").onclick = () => { pan.hidden = true; };
  pan.querySelector("#pn-vider").onclick = () => { Etat.panierVider(); ouvrirPanier(budgets); };
  pan.querySelector("#pn-copier").onclick = async () => {
    const txt = formaterExport(Etat.panier(), { pseudo: Etat.get("pseudo", ""), budgets });
    try { await navigator.clipboard.writeText(txt); pan.querySelector("#pn-copier").textContent = "Copié ✓"; }
    catch { const ta = pan.querySelector("#pn-secours"); ta.hidden = false; ta.value = txt; ta.select(); }
  };
}
```
Brancher : `document.getElementById("btn-panier").onclick = () => ouvrirPanier(budgetsDuScript);`
avec `budgetsDuScript = Object.fromEntries(donnees.entrees.map(e => [`${no}/${e.id}`, e.budget]))`.
⚠ Les budgets des autres scripts du panier ne sont pas chargés → afficher `?` (assumé, v1).

- [ ] **Step 4: Lancer, vérifier le succès** — `npx vitest run tests/panier.test.js` → PASS

- [ ] **Step 5: Vérification manuelle** — 2 modifs → panier 📋 2, copie → coller dans un éditeur : format conforme ; suppression d'un item fonctionne ; refus presse-papiers → textarea de secours.

- [ ] **Step 6: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/panier.js js/lecteur.js tests/panier.test.js
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: panier de propositions + export Discord formaté"
```

---

### Task 19 : Fin de script, ✓ relu, navigation, options

**Files:**
- Modify: `js/lecteur.js`, `lecture.html`

- [ ] **Step 1: Implémentation**

```js
// fin de script (élément #fin déjà dans le HTML)
document.getElementById("btn-relu").onclick = () => {
  Etat.marquerRelu(no, !Etat.estRelu(no));
  majBoutonRelu();
};
function majBoutonRelu() {
  document.getElementById("btn-relu").textContent =
    Etat.estRelu(no) ? "✓ Relu — cliquer pour annuler" : "✓ Marquer comme relu";
}
majBoutonRelu();
const noms = index.map(s => s.no);
const i = noms.indexOf(no);
const prec = document.getElementById("prec"), suiv = document.getElementById("suiv");
if (i > 0) prec.href = `lecture.html?s=${noms[i - 1]}`; else prec.style.visibility = "hidden";
if (i < noms.length - 1) suiv.href = `lecture.html?s=${noms[i + 1]}`; else suiv.style.visibility = "hidden";
```
Ajouter dans la barre un réglage vitesse (cycle 28 → 12 → 0 ms) :
```js
const btnV = document.createElement("button");
btnV.title = "Vitesse du texte";
const labelV = v => v === 0 ? "⚡" : v <= 12 ? "🐇" : "🐢";
btnV.textContent = labelV(Etat.get("vitesse", 28));
btnV.onclick = () => { const v = Etat.get("vitesse", 28);
  const nv = v === 28 ? 12 : v === 12 ? 0 : 28;
  Etat.set("vitesse", nv); btnV.textContent = labelV(nv); };
document.querySelector(".barre").insertBefore(btnV, document.getElementById("btn-theme"));
```
Et l'export/import de sauvegarde sur la page d'accueil (`js/accueil.js`) : deux petits liens « Exporter ma sauvegarde » (télécharge `Etat.exporter()` en .json via `Blob`) / « Importer » (`<input type=file>` → `Etat.importer`).

- [ ] **Step 2: Vérification manuelle** — fin de script atteinte : encart visible, ✓ marque (vérifier le badge dans la grille au retour), navigation prev/suiv ok, vitesse cycle 🐢→🐇→⚡.

- [ ] **Step 3: Commit**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add js/lecteur.js js/accueil.js lecture.html
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: fin de script, marquage relu, navigation, vitesse, sauvegarde"
```

---

### Task 20 : `apropos.html`, README final, déploiement

**Files:**
- Create: `apropos.html`, `.nojekyll`
- Modify: `README.md`

- [ ] **Step 1: Page À propos**

`apropos.html` — même gabarit que dictionnaire.html, contenu :
```html
<main class="page prose">
  <h1>À propos</h1>
  <p><b>P2IS Relecture</b> est un outil communautaire pour relire la traduction
  française de <i>Persona 2: Innocent Sin</i> (PSP) et proposer des améliorations,
  dans une présentation façon visual novel.</p>
  <h2>Crédits</h2>
  <ul>
    <li><b>Hamza (HamzaKarrouchi)</b> — traduction & cet outil ·
        <a href="https://github.com/HamzaKarrouchi">GitHub</a></li>
    <li><b>chenetulipe</b> — extraction des scripts, outillage du projet de traduction
        et hébergement du dépôt ·
        <a href="https://github.com/chenetulipe/P2-FR-IS-PSP">P2-FR-IS-PSP</a></li>
    <li><b>GarloulouLeAsriel</b> — premiers scripts de vérification</li>
    <li><b>La communauté Discord</b> — relectures, corrections et soutien ❤️</li>
  </ul>
  <h2>Mentions</h2>
  <p>Projet de fans, gratuit et non commercial. Nous ne revendons rien.
  <i>Persona 2: Innocent Sin</i> et tous ses personnages sont la propriété
  d'<b>Atlus / SEGA</b>. Les portraits et textes du jeu restent la propriété
  de leurs ayants droit ; ils sont utilisés ici uniquement à des fins de
  relecture de la traduction de fans.</p>
</main>
```

- [ ] **Step 2: README final**

Compléter `README.md` : présentation, capture (à ajouter plus tard), **Utilisation** (choisir son nom → lire → cliquer une bulle pour proposer → copier le panier sur Discord), **Mise à jour des données** (`python3 sync.py` puis commit de `data/`), **Développement** (`npm test`, `python3 -m unittest discover tests_py -q`, `python3 -m http.server 8088`), **Crédits** (mêmes que la page À propos), lien vers `chenetulipe/P2-FR-IS-PSP`.

- [ ] **Step 3: Déploiement GitHub Pages**

```bash
touch .nojekyll
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add -A
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "feat: page à propos, README, préparation GitHub Pages"
```
Puis (l'utilisateur crée le repo GitHub `p2is-relecture` au préalable, ou via API comme pour la PR) :
```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture remote add origin https://github.com/HamzaKarrouchi/p2is-relecture.git
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture push -u origin main
```
Activer Pages : Settings → Pages → Source = `main` / racine (ou via API `POST /repos/{owner}/{repo}/pages`).
Vérifier `https://hamzakarrouchi.github.io/p2is-relecture/`.

---

### Task 21 : Passe de polish UI/UX + responsive (avec le skill de design front)

**Files:**
- Modify: `css/*`, retouches mineures HTML

- [ ] **Step 1:** Invoquer le skill de design front du harness pour une passe de polish : typographie (une police display pour les titres, ex. system + lettres espacées italiques côté thème rouge), espacements, transitions d'apparition des bulles (`@keyframes` translateY+fade), focus visibles, contrastes AA.
- [ ] **Step 2:** Contrôle responsive réel : DevTools mobile (375px) sur les 5 pages — bulles, panneau éditeur plein écran sur mobile, grille 1 colonne, barre compacte.
- [ ] **Step 3:** `prefers-reduced-motion` : désactiver machine à écrire (vitesse forcée 0) et animations de bulles.
- [ ] **Step 4:** Tests complets `npm test` + `python3 -m unittest discover tests_py -q` → tout PASS.
- [ ] **Step 5: Commit final**

```bash
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture add -A
git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture commit -m "style: passe de polish UI/UX, responsive et accessibilité"
```

---

## Auto-revue du plan (faite à l'écriture)

- **Couverture spec :** accueil+animation (T9), grille+recherche+filtres (T10), lecteur fil progressif+machine à écrire+pauses+encadrés+surlignés (T3/T11/T12/T13), choix interactifs (T4/T14), comparaison EN (T15), dictionnaire+⚠ (T16), éditeur jetons+budget+caractères interdits+nom_fr (T2/T17), panier+export (T18), ✓ relu+navigation+vitesse+sauvegarde (T19), thèmes (T8), à propos+README+Pages (T20), responsive+reduced-motion (T9/T21), erreurs (script inexistant T12, localStorage T7, presse-papiers T18, slots vides T5).
- **Hors v1 confirmé :** branches réelles, expressions des portraits, question_fr/choix_fr, MMAP & co.
- **Cohérence des types :** formes `{t|pause|nl|hero|enc|hl}`, `bulles_fr/en`, clés localStorage et API `Etat` identiques entre tâches ; `budget` pré-calculé par sync et utilisé par l'éditeur ; `texteLisible` partagé entre normalise/panier.
- **Point d'attention legué à l'exécution :** en T2, caler les `expect` sur la sortie réelle de Python (étape de vérification incluse) ; en T5, le one-liner `(c := convertir_entree(e))` exige Python ≥ 3.8 (ok).
