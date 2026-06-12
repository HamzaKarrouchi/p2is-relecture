# P2IS Relecture 🦋

Outil web de **relecture de la traduction française de Persona 2: Innocent Sin (PSP)** :
on lit les scripts du jeu comme un visual novel (portraits, bulles, machine à écrire,
choix), on clique sur une bulle pour proposer une correction — avec contrôle automatique
de la **limite de taille binaire** du jeu — et on copie ses propositions, formatées,
pour les poster sur Discord.

> Projet de fans, gratuit et non commercial. *Persona 2: Innocent Sin* © Atlus / SEGA.
> Le projet de traduction : **https://github.com/chenetulipe/P2-FR-IS-PSP**

## Fonctionnement

1. **Accueil** (`index.html`) : choisis le prénom/nom du protagoniste (défaut Tatsuya
   Suou) — ils remplacent les placeholders `[1113]`/`[1112]` pendant la lecture.
2. **Grille** (`scripts.html`) : 399 scripts, recherche plein texte, filtre par
   personnage, progression ✓ par script.
3. **Lecture** (`lecture.html?s=NNN`) : fil de bulles progressif (clic/Espace),
   héros à droite, PNJ à gauche, comparaison FR/EN, termes du dictionnaire colorés.
4. **Proposition** : clic sur une bulle → éditeur à jetons (les codes du jeu sont des
   pastilles insécables), jauge d'octets en direct, validation bloquée hors budget.
5. **Export** : le panier 📋 regroupe tes propositions → « Copier pour Discord ».

Tout est local (localStorage) : aucun compte, aucun serveur.

## Développement

Site **100 % statique** : HTML/CSS/JS vanilla (modules ES), zéro dépendance runtime,
zéro build. Servir le dossier suffit :

```bash
python3 -m http.server 8088       # http://localhost:8088
```

### Tests

```bash
npm install                        # une fois (vitest, devDependency uniquement)
npm test                           # tests JS (budget, etat, theme, grille, normalise…)
python3 -m unittest discover tests_py -q   # tests Python (sync)
```

### Données (`data/`)

`data/` est **généré** par `sync.py` depuis le repo de traduction
(`../../Trad_Persona2/P2-FR-IS-PSP/`) puis **commité** (le site est autonome).
Quand la traduction évolue :

```bash
python3 sync.py                    # régénère data/
git -C . diff --stat data/         # relire le diff
# puis commit
```

Exceptions éditables à la main (préservées par sync) : `data/labels.json`
(étiquettes des scripts) et `data/personnages.json` (portraits/emoji/couleurs).

### Le calcul d'octets (`js/budget.js`)

Portage **exact** de `json_verify/utils.py:estimate_bytes` du repo de traduction —
la référence absolue qui garantit qu'un texte tient dans le slot binaire PSP.
Validé croisé sur 183 entrées réelles (`tests/fixtures-budget.json`).
**Ne jamais modifier l'algorithme d'un seul côté.**

## Workflow git

- ⚠ Le dossier parent est un autre repo git : **toujours**
  `git -C /home/pchamza/Project/P2IS_Relecture/p2is-relecture <commande>`.
- `main` = stable/déployé (GitHub Pages). Le développement se fait sur des branches
  (actuellement `site-v1`), mergées dans `main` quand c'est fonctionnel.
- 1 tâche du plan = 1 commit (préfixes `feat:`/`fix:`/`chore:`/`docs:`),
  TDD : le commit inclut toujours ses tests.
- Le plan d'implémentation détaillé : `docs/superpowers/plans/2026-06-12-site-relecture-p2is.md`
  — le spec validé : `docs/superpowers/specs/2026-06-12-site-relecture-p2is-design.md`
  — l'avancement : `ROADMAP.md`.

## Crédits

- **Hamza (HamzaKarrouchi)** — traduction & cet outil
- **chenetulipe** — extraction des scripts, outillage et hébergement du projet de traduction
- **GarloulouLeAsriel** — premiers scripts de vérification
- **La communauté Discord** — relectures, corrections et soutien ❤️
