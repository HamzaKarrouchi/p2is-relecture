# Spec — Site de relecture de la traduction P2IS (« p2is-relecture »)

Date : 2026-06-12 · Validé avec Hamza au terme du brainstorming.

## 1. But

Site web statique permettant de **relire la traduction française de Persona 2: Innocent Sin (PSP)** de façon fluide et agréable — présentation façon visual novel — et de **proposer des modifications** claires, directement copiables dans les JSON de traduction, exportées en texte formaté pour Discord.

Public : Hamza + les relecteurs du Discord de la traduction. Pas de comptes, pas de backend, pas de collecte centralisée : chaque relecteur travaille dans son navigateur et poste ses propositions sur Discord.

## 2. Décisions structurantes (issues du brainstorming)

| Sujet | Décision |
|---|---|
| Hébergement | Statique en ligne (GitHub Pages), **zéro backend** |
| Source des données | **Copie embarquée** dans le site, régénérée par `sync.py` depuis le repo local `Trad_Persona2/P2-FR-IS-PSP` (branche de travail) |
| Nom du héros | Écran d'accueil : **prénom + nom**, défauts « Tatsuya » / « Suou » ; remplacent `[1113]`/`[1112]` à l'affichage uniquement (les exports gardent les placeholders bruts) |
| Édition | **Éditeur à jetons** : codes affichés en pastilles insécables, texte libre autour, budget d'octets exact en direct |
| Lecture | **Fil de bulles progressif** scrollable (héros à droite, PNJ à gauche), révélation au clic/espace |
| Animation texte | **Machine à écrire** (vitesse réglable + mode instantané) ; 1er clic complète, 2e clic avance ; pauses `[1205]` = micro-pauses |
| Choix Q/R | **Interactifs cosmétiquement** : on clique une option pour continuer (elle s'illumine), mais le fil reste linéaire — les JSON ne contiennent pas les embranchements, et la relecture doit montrer 100 % des textes |
| Propositions | **Panier** persistant (localStorage), export groupé formaté pour Discord (copier-coller) |
| Comparaison EN | Toggle global (EN grisé sous chaque bulle FR) **et** bouton 🔁 par bulle |
| Dictionnaire | Termes validés colorés dans le texte, infobulle au clic, page glossaire dédiée, ⚠ d'incohérence terminologique |
| Sélection de script | Grille + étiquettes (`labels.json`) + personnages auto-extraits + recherche plein texte + filtre par personnage |
| Progression | « ✓ relu » par script, localStorage par navigateur, export/import de sauvegarde JSON |
| Thème | **Deux thèmes au choix de l'utilisateur** : « Innocent Sin » rouge/noir et « Menus PSP » bleu nuit (variables CSS, mémorisé) |
| Accueil | Fond animé : **papillon bleu (Philémon) + petites flammes bleues flottantes** (CSS/JS léger, respecte `prefers-reduced-motion`) |
| Portraits | Copiés **dans le projet** depuis `personadle/database/portraits` (Maya = `Maya_A.webp`) ; repli image → emoji → initiale via `personnages.json` |
| Stack | **Vanilla HTML/CSS/JS multi-pages, modules ES, zéro build, zéro dépendance** (comme personadle) ; `sync.py` en Python ; tests vitest (devDependency uniquement) |
| Emplacement | `/home/pchamza/Project/P2IS_Relecture/p2is-relecture/` (dossier chapeau + repo git dedans — le parent `Project/` est lui-même un repo git : toujours `git -C`) |
| Repo | GitHub de Hamza, README explicatif renvoyant vers le repo chenetulipe, CLAUDE.md |

## 3. Structure du projet

```
p2is-relecture/
├── index.html            # Accueil : prénom/nom du prota, papillon + flammes
├── scripts.html          # Grille des 399 scripts
├── lecture.html          # Lecteur (?s=062)
├── dictionnaire.html     # Glossaire EN→FR
├── apropos.html          # Crédits & disclaimer
├── css/
│   ├── commun.css        # layout, composants, variables partagées
│   ├── theme-rouge.css   # thème « Innocent Sin » (noir/rouge)
│   └── theme-nuit.css    # thème « Menus PSP » (bleu nuit/rouge)
├── js/
│   ├── etat.js           # localStorage : nom, pseudo, thème, progression, panier, options
│   ├── budget.js         # portage exact d'estimate_bytes (json_verify) en JS
│   ├── normalise.js      # helpers d'affichage (placeholders nom, segments, dico)
│   ├── lecteur.js        # fil de bulles, machine à écrire, choix, comparaison EN
│   ├── editeur.js        # éditeur à jetons (contenteditable maison), jauge d'octets
│   ├── panier.js         # panier de propositions + export Discord
│   ├── dico.js           # coloration des termes, infobulles, ⚠ incohérences
│   └── grille.js         # scripts.html : grille, recherche, filtres
├── data/                 # GÉNÉRÉ par sync.py — ne jamais éditer à la main
│   ├── index.json        # par script : n°, étiquette, personnages, nb répliques
│   ├── scripts/NNN.json  # entrées prêtes à lire (cf. §4)
│   ├── dictionnaire.json # depuis Dictionnaire.md
│   ├── personnages.json  # nom_orig → {portrait?, emoji, couleur} (éditable : sync préserve les ajouts)
│   ├── labels.json       # étiquettes des scripts (éditable ; pré-rempli depuis les commits de trad)
│   └── recherche.json    # index de recherche plein texte (textes normalisés concaténés par script)
├── img/portraits/        # .webp copiés depuis personadle
├── sync.py               # régénération de data/ depuis ../../Trad_Persona2/P2-FR-IS-PSP/
├── tests/                # vitest : budget, normalisation, export
├── README.md             # présentation, captures, lien chenetulipe, crédits
├── CLAUDE.md             # conventions (git -C, data/ généré, sync.py, tests)
└── .gitignore            # node_modules, .superpowers, *.tmp
```

## 4. Données générées (`sync.py`)

`sync.py` lit `traduction/event_scripts/script_NNN.json` (+ `Dictionnaire.md`) et produit pour **chaque entrée** :

```json
{
  "id": 4,
  "nom_fr": "Bel homme", "nom_en": "Handsome man",
  "affichage_fr": [ {"t": "J'ai des ordres de notre Reine..."},
                    {"pause": true},
                    {"t": "Vous mourrez tous ici !"} ],
  "affichage_en": [ … ],
  "choix": null,
  "brut_fr": "J'ai des ordres de notre Reine...\nVous mourrez tous ici !",
  "brut_en": "I'm[SP]under[SP]orders...",
  "data_size": 152, "budget": 144
}
```

- `affichage_*` : segments prêts à rendre — texte pur, marqueurs de pause, sauts de ligne, encarts `[1432]`, placeholders héros (`{"hero": "prenom"}`/`{"hero": "nom"}`). Toute la normalisation (`[SP]`→espace, suppression `[E1-4]`/`[NULL]`, découpe aux blocs locuteur internes `"Nom`) est faite **à la synchro**, en réutilisant la logique éprouvée de `migration/core.py`. Une entrée contenant des blocs locuteur internes est éclatée en plusieurs bulles d'affichage (rattachées au même id pour l'édition).
- `choix` : pour les menus, `{ "question": [...segments], "options": ["Oui", "Non"] }` (extraits des structures `[1208]`/`[1432]` comme le fait `_parse_choices`).
- `brut_fr` + `budget` : pour l'éditeur et l'export. Le budget = `data_size - 8`, le coût inclut `nom_fr` (même règle que `json_verify`).
- `index.json` : personnages par script (depuis `nom_orig`), étiquettes depuis `labels.json`, comptes.
- `personnages.json` et `labels.json` sont **préservés** d'une synchro à l'autre (sync ajoute les nouveaux noms avec emoji par défaut, ne touche pas aux choix manuels).

## 5. Le lecteur (`lecture.html?s=NNN`)

- Barre haute : n° + étiquette, progression (n/total), toggles comparaison EN et thème, panier 📋 (badge), retour grille.
- Fil : bulles révélées une à une (clic/Espace/▼) avec machine à écrire ; « tout dérouler » disponible ; position retenue.
- Bulles : PNJ à gauche (portrait/emoji/initiale + nom + texte), héros à droite (nom choisi). Placeholders héros légèrement surlignés. Pauses = coupure douce ⏸ discrète. Encadrés `[1432]` en encart stylisé.
- Menus : question + options en boutons ; clic sur une option = surbrillance + lecture qui continue (linéaire).
- Dictionnaire : termes FR validés colorés ; clic → infobulle (EN, lien glossaire). Mode comparaison : EN grisé sous le FR + 🔁 par bulle ; ⚠ si l'EN contient un terme du dico et que le FR n'utilise pas la traduction validée.
- Fin de script : « ✓ Marquer comme relu » + navigation précédent/suivant.

## 6. L'éditeur à jetons

- Clic sur bulle → panneau : bulle EN de référence + éditeur + aperçu en direct + jauge.
- Éditeur `contenteditable` maison : les codes du `brut_fr` sont rendus en **jetons insécables** (⏸ pause, ⏎ saut de ligne, 🔲 encadré, 👤 héros, jeton générique sinon). Texte libre autour ; jetons supprimables/déplaçables en bloc, jamais éditables de l'intérieur ; boutons d'insertion ⏎ et ⏸.
- Jauge d'octets en direct `184/212` (vert→orange→rouge), **validation bloquée au-dessus du budget**. Caractères hors liste supportée (`é è ê à ç ù â î ô û œ ü ï` + majuscules) surlignés en rouge, validation bloquée avec explication.
- `nom_fr` éditable pareillement (compte dans le même budget).
- Valider → bulle marquée 📝 dans le fil (ancien texte barré + nouveau), proposition au panier ; rééditable/annulable.

## 7. Panier & export Discord

- Persistant (localStorage), groupé par script, propositions supprimables/rééditables.
- « Copier pour Discord » → presse-papiers :

```
📋 Propositions de <pseudo> — P2IS Relecture
**Script 062**
• id 4 (138/144 o)
  ancien : <texte lisible, ⏎/⏸ symbolisés>
  proposé : <texte lisible>
  brut : `<brut_fr proposé exact, copiable dans le JSON>`
```

- Les exports utilisent les **placeholders bruts** `[1113]`/`[1112]`, jamais le nom choisi. Bouton « vider après copie ». Pseudo configurable.

## 8. Pages annexes

- **`index.html`** : champs prénom/nom (défauts Tatsuya/Suou), bouton « Commencer la relecture », fond animé papillon bleu + flammes bleues (léger, `prefers-reduced-motion` respecté).
- **`scripts.html`** : grille 399 cases (n°, étiquette, personnages, nb répliques, ✓/📝), recherche plein texte (via `recherche.json`), filtre par personnage.
- **`dictionnaire.html`** : glossaire EN→FR recherchable.
- **`apropos.html`** : but de l'outil, Hamza (GitHub), chenetulipe (extraction + repo de trad, lien), GarloulouLeAsriel (premiers scripts de vérification), communauté Discord, disclaimer : projet de fans non commercial, Persona 2 © Atlus.

## 9. Hors périmètre (v1)

- Pas de backend, comptes, collecte centralisée des propositions, modération.
- Pas de vrais embranchements de dialogue (données absentes des JSON).
- Pas d'expressions multiples des portraits (portrait fixe unique).
- Pas d'édition des champs `question_fr`/`choix_fr` dédiés des menus (le texte_fr inline suffit pour la relecture ; à reconsidérer plus tard).
- AutreScript/MMAP/F_BE/TM_EVE : seuls les 399 `event_scripts` sont couverts en v1 (sync extensible ensuite).

## 10. Gestion des erreurs & cas limites

- Script demandé inexistant → retour grille avec message.
- localStorage plein/indisponible → bandeau d'avertissement, lecture toujours possible (sans sauvegarde).
- Presse-papiers refusé → zone de texte sélectionnable en secours.
- Entrées sans `texte_orig` (slots vides) → ignorées par sync.
- `data/` absent (clone frais sans sync) → les fichiers `data/` générés sont **commités** dans le repo (le site est autonome ; sync.py sert à les rafraîchir).

## 11. Tests

- **vitest** (seule devDependency) : `budget.js` (portage validé par comparaison de cas exportés depuis `json_verify`/`migration` — mêmes textes, mêmes coûts), `normalise.js` (placeholders, segments), `panier.js` (format d'export stable).
- `sync.py` : tests unittest côté Python (réutilise le style de `migration/tests/`), notamment l'éclatement en bulles et l'extraction des choix.
- Vérification manuelle responsive (mobile/desktop) au moment de l'implémentation, avec le skill de design front pour le polish UI.

## 12. Déploiement

- GitHub Pages depuis `main` (site 100 % statique, `data/` commité).
- Workflow : trad évolue → `python sync.py` → relire le diff de `data/` → commit → push → Pages à jour.
