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
