# CLAUDE.md — p2is-relecture

Site statique de relecture de la traduction FR de Persona 2: Innocent Sin (PSP) :
lecteur visual novel + propositions de modifications bornées par le budget d'octets
du jeu + export Discord. Spec complet :
`docs/superpowers/specs/2026-06-12-site-relecture-p2is-design.md`.

## Reprendre le travail

1. Lire `ROADMAP.md` (état exact : tâches faites avec commits, tâches restantes,
   portraits manquants, dettes de données).
2. Le plan d'implémentation pas-à-pas (code inclus) :
   `docs/superpowers/plans/2026-06-12-site-relecture-p2is.md` — on l'exécute en
   subagent-driven (1 agent implémenteur par tâche + revue spec + revue qualité).
   ⚠ Les agents en arrière-plan ne peuvent pas répondre aux prompts de permission :
   implémenteurs en avant-plan, revues en arrière-plan.
3. Vérifier l'état : `npm test` (43+ tests) et
   `python3 -m unittest discover tests_py -q` (15+ tests) doivent être verts.

## Workflow git (obligatoire)

- Le parent `/home/pchamza/Project/` est un AUTRE repo git : TOUJOURS
  `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture <commande>`.
- `main` = stable/déployable (GitHub Pages plus tard). Développement sur branche
  (`site-v1` actuellement), merge dans `main` quand fonctionnel — jamais de
  commit direct sur `main`.
- 1 tâche du plan = 1 commit, message `feat:`/`fix:`/`chore:`/`docs:` en français.
  TDD : chaque commit de feature inclut ses tests.
- Les correctifs issus des revues = commit `fix(revue …):` séparé.

## Règles techniques

- Zéro dépendance runtime, zéro build : HTML/CSS/JS vanilla, modules ES, multi-pages
  (index, scripts, lecture, dictionnaire, apropos). vitest+jsdom en devDependency
  uniquement.
- `data/` est GÉNÉRÉ par `python3 sync.py` depuis `../../Trad_Persona2/P2-FR-IS-PSP/`
  puis COMMITÉ — ne jamais l'éditer à la main, SAUF `data/labels.json` et
  `data/personnages.json` (préservés par sync).
- Budget d'octets : `js/budget.js` est le portage EXACT de
  `json_verify/utils.py:estimate_bytes` du repo de trad — ne jamais « améliorer »
  l'algorithme sans synchroniser les deux côtés (vérité = Python ; fixtures
  croisées dans `tests/fixtures-budget.json`).
- Sécurité rendu : jamais de `innerHTML` avec des données issues de la trad
  (labels, noms, textes) — `textContent`/`createElement` uniquement.
- localStorage : uniquement via `js/etat.js` (préfixe `p2isr.`).
- Les exports Discord gardent les placeholders bruts `[1113]`/`[1112]`
  (jamais le nom choisi par l'utilisateur).
- Écritures de fichiers côté Python : TOUJOURS atomiques (tmp + relecture +
  os.replace) — un disque plein a déjà tronqué des fichiers deux fois.

## Commandes

```bash
python3 -m http.server 8088                  # servir le site en local
npm test                                     # tests JS
python3 -m unittest discover tests_py -q     # tests Python
python3 sync.py                              # régénérer data/ depuis la trad
```
