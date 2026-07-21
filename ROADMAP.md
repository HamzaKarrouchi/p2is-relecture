# ROADMAP — P2IS Relecture

**Site déployé** sur GitHub Pages : <https://hamzakarrouchi.github.io/p2is-relecture/>
· dépôt <https://github.com/HamzaKarrouchi/p2is-relecture> · branche `main`.

État actuel : **v1 complète (T1-T21)** + **refonte visuelle Velvet Editorial** +
**infra repo** (CI/CD, hooks, issues) + **export panier → issue GitHub** +
**édition des réponses de menus** + **407 scripts** (400 + 7 scripts spéciaux,
dont MMAP03).
Suite de tests : **141 tests JS + 24 tests Python, tous verts** + 2 scripts
`e2e/` (Playwright, hors CI).

## 🔀 Fork P2-FR-IS-PSP resynchronisé — miroir complet (2) (2026-07-21)

Deuxième miroir complet : l'upstream réel de chenetulipe avait 1499 commits
d'avance depuis le miroir du 07-17 (correctifs de formatage/débordement dont
une balise `[1101]` de troncature auto, `Mr Bunbun` traduit, dictionnaire mis
à jour...). Même méthode que d'habitude (contenu, pas `git merge` — historique
racine sans parent) : [PR #41](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/pull/41)
côté trad, réappliquant CI/`nom_fr`/`script_120` + 240 des 248 corrections de
Seb (6 fusionnées avec les correctifs de mise en forme indépendants faits
par chenetulipe entre-temps, 8 exclues — déjà équivalentes ou adjacentes à
une balise `[1101]` qu'on ne recalcule pas sans certitude).
[PR #17](https://github.com/HamzaKarrouchi/p2is-relecture/pull/17) : `data/`
régénéré côté ce dépôt.

Branche `pr-chenetulipe-seb-2026-07-21` préparée (basée directement sur
l'historique réel de chenetulipe, 240 corrections de traduction uniquement)
pour proposer les corrections de Seb en amont — la création de PR cross-repo
vers `chenetulipe/*` est hors du périmètre GitHub de cette session, lien de
comparaison fourni à Hamza pour ouverture manuelle.

## 📥 248 corrections de Seb via le panier → issues (2026-07-21)

Seb a proposé 248 corrections de relecture réparties sur 27 issues GitHub
(#12 à #39, certaines scindées en plusieurs parties par la limite de longueur
d'URL) créées entre le 2026-07-19 et le 2026-07-21 via le panier du site.
Traitées **dans l'ordre de création des issues** (demande explicite de Seb :
il corrige parfois dans une issue postérieure une entrée déjà proposée avant,
par oubli) — 6 cas où une entrée (script, id) a été reproposée dans une issue
plus récente, la version la plus récente retenue à chaque fois (script_008
id28, script_010 id17, script_011 id5/9/12, script_019 id22). Issue #23,
fermée par Seb lui-même une minute après sa création, non reprise.

[PR #40](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/pull/40) côté trad
(19 fichiers `script_000` à `script_020`, 0 mismatch sur 248) + régénération
`data/` côté ce dépôt
([PR #15](https://github.com/HamzaKarrouchi/p2is-relecture/pull/15)). Les 27
issues fermées manuellement (le mot-clé `Closes` en liste virgule n'a fermé
que la première automatiquement).

## 🗺️ Scripts spéciaux : CD_SHOP, F_BE, MMAP01-06 (2026-07-08)

Le mirror complet de P2-FR-IS-PSP (voir plus bas) a révélé que ces scripts,
hors `event_scripts/` et donc jusqu'ici invisibles du site, sont en fait
déjà largement traduits. Ajoutés dans `sync.py` (`SCRIPTS_SPECIAUX`,
`traiter_script()`) avec une numérotation dédiée (900+, pas de collision
avec les `script_NNN`) :

| No  | Fichier   | Traduit |
|-----|-----------|---------|
| 900 | CD_SHOP   | 100 %   |
| 901 | F_BE      | 100 %   |
| 902 | MMAP01    | 100 %   |
| 903 | MMAP02    | 99,7 %  |
| 905 | MMAP04    | 91 %    |
| 906 | MMAP05    | 100 %   |
| 907 | MMAP06    | 98,6 %  |

MMAP03 et TM_EVE sont encore à 0 % traduits côté P2-FR-IS-PSP : pas encore
ajoutés (cf. § v2 plus bas), il suffira de les rajouter à
`SCRIPTS_SPECIAUX` une fois traduits. Les quelques répliques non traduites
des scripts ci-dessus n'apparaissent simplement pas dans le fil de lecture
(comportement déjà existant pour tout script partiellement traduit).

## 🔀 Panier → issue GitHub + édition des réponses (2026-07-07)

- Le panier ne copie plus vers Discord en premier lieu : bouton
  « 🐙 Créer une issue GitHub » qui ouvre `HamzaKarrouchi/P2-FR-IS-PSP/issues/new`
  pré-rempli (titre + corps Markdown, label `relecture`), sans backend ni
  token côté client (`js/panier.js:construireLiensIssues`). Panier volumineux
  scindé en plusieurs issues si l'URL dépasserait ~7500 caractères. Repli :
  liens cliquables si la pop-up est bloquée, bouton Copier toujours là.
- Nouveau bouton ✏️ sur les blocs `.choix` : éditeur dédié aux réponses
  (`js/editeur.js:ouvrirEditeurChoix`) — la question reste gelée, seules les
  options sont modifiables, budget/caractères interdits vérifiés comme
  l'éditeur de bulle. Ferme l'item « v2 » ci-dessous.
- 138 corrections de relecture (8 contributeurs, cf. panier Discord d'avant
  cette bascule) appliquées directement dans `P2-FR-IS-PSP`
  ([PR #2](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/pull/2)) + `data/`
  régénéré côté ce dépôt.
- Petites fonctions : bouton « Réinitialiser » sur la grille des scripts
  (`js/grille.js`), raccourci clavier **P** pour ouvrir/fermer le panier en
  lecture (`js/lecteur.js:basculerPanier`).
- Docs : `CONTRIBUTING.md` (guide relecteur), README à jour.
- Tests : `dico.js` renforcé (faux positifs, casse, cumul), 2 scripts
  `e2e/` Playwright (éditeur de choix, non-régression responsive).

### 🔀 Fork P2-FR-IS-PSP resynchronisé — miroir complet (2026-07-17)

Le fork avait re-divergé de l'upstream réel de chenetulipe (docs, `Dictionnaire.md`
déplacé à la racine et reformaté en 3 colonnes, `overflows_list.txt`, MMAP03 passé
à 100 %, nombreuses révisions de traduction). Cette fois, miroir **complet** (pas
seulement `traduction/event_scripts/`) : tout le contenu de
`chenetulipe/P2-FR-IS-PSP:main` (330 fichiers) recopié tel quel par-dessus le
fork, puis les correctifs propres au fork réappliqués par-dessus (vérifiés un
par un contre le texte upstream avant écriture, jamais d'écrasement aveugle) :
- CI (`check_scripts.yml`) : chemin `traduction/event_scripts/*.json` (upstream
  avait réintroduit l'ancien chemin `scripts/*.json`, obsolète)
- 4 `nom_fr` pollués (script_038/157/248/296/359/360)
- 6 corrections de Seb sur `script_002` (adaptées au wrapping upstream pour
  2 d'entre elles, qui avait changé indépendamment)
- 1 correction de relecture restante (`script_120` id0)

[PR #11](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/pull/11) mergée côté
trad (le check JsonVerify échoue sur des dépassements de budget préexistants
dans le contenu amont de chenetulipe — hors périmètre, déjà trackés dans son
`overflows_list.txt` — merge fait malgré ce statut `unstable`).
[PR #13](https://github.com/HamzaKarrouchi/p2is-relecture/pull/13) : `data/`
régénéré (dictionnaire à jour dont « Boss des calbutes »/« Jeu du Joker », et
MMAP03 ajouté à `SCRIPTS_SPECIAUX` — 407 scripts). Supersède et ferme
[PR #12](https://github.com/HamzaKarrouchi/p2is-relecture/pull/12) (proposition
de chenetulipe basée sur un état qui aurait fait régresser les corrections de
Seb).

### 🔀 Fork P2-FR-IS-PSP resynchronisé (2026-07-07)

Découverte : `HamzaKarrouchi/P2-FR-IS-PSP` n'a **aucun historique git commun**
avec `chenetulipe/P2-FR-IS-PSP` (commit racine sans parent — import figé, pas
un vrai fork). `git merge` impossible : resynchronisation par **contenu**
à la place.
- [PR #3](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/pull/3) :
  `traduction/event_scripts/` (399 fichiers) + `Dictionnaire.md` remplacés
  par la version actuelle de chenetulipe (1432 commits d'avance) + les 4
  `nom_fr` pollués corrigés au passage. `data/` régénéré côté ce dépôt.
- Sur les 138 corrections de la PR #2, 9 étaient déjà présentes côté
  chenetulipe et 8 avaient une formulation légèrement différente déjà
  choisie côté chenetulipe (non écrasées). Les 121 restantes : branche
  `relecture-121-corrections` poussée sur le fork, lien de PR croisée prêt
  vers chenetulipe (non créée automatiquement, dépôt hors périmètre de
  cette session) :
  <https://github.com/chenetulipe/P2-FR-IS-PSP/compare/main...HamzaKarrouchi:P2-FR-IS-PSP:relecture-121-corrections?expand=1>

## 🦋 Refonte visuelle « Velvet Editorial » (2026-06-16)

Branche `redesign-velvet-editorial`. Spec :
`docs/superpowers/specs/2026-06-16-redesign-velvet-editorial-design.md` ·
Plan : `docs/superpowers/plans/2026-06-16-redesign-velvet-editorial.md`.

Refonte complète de la peau du site (grimoire de relecture nocturne, serif,
palette Persona 2 IS) sans toucher au moteur ni aux contrats DOM :

- Polices auto-hébergées (Cormorant Garamond + Libre Baskerville).
- Thèmes **Velvet Nuit** (défaut) / **Velvet Jour** — renomme l'ancien `rouge`→`jour`.
- `commun.css` + `accueil.css` réécrits (barre, bulles, sommaire, panneaux, glossaire, colophon).
- Accueil frontispice + **révélation portrait+nom** à l'entrée ; papillon recoloré bleu Philémon.
- Icônes SVG de chrome (fin des émojis), toasts non bloquants (remplacent `alert`).
- Responsive 375→1440, `prefers-reduced-motion` respecté.

Suite de tests : **97 tests JS + 15 tests Python, tous verts.**

## ✅ Fait (T1-T11)

| Tâche | Commit(s) | Contenu |
|---|---|---|
| T1 squelette | bacc511 | gitignore, package.json (vitest), CLAUDE.md, README |
| T2 budget.js | 3833dd8 | portage exact estimate_bytes, 11 tests + 183 fixtures croisées |
| T3 sync normalisation | bebee28 | en_segments/en_bulles (11 tests), marqueurs U+E000-E007 |
| T4 sync choix | 2289c29 | extraire_choix (menus simple + [1432]), 4 tests |
| T5 sync génération | d8164c9, 246e141 | data/ complet : 399 scripts, index, recherche (incl. hl/enc), dico (42 termes), 205 labels auto |
| T6 portraits | 8eedc92, e932c6f | 12 portraits (re-copiés après bug 0-octet), personnages.json enrichi |
| T7 etat.js | 114635b | localStorage (héros, relus, panier, export/import), 6 tests |
| T8 thèmes | 11db874 | nuit/rouge (variables CSS), composants bulles, theme.js, 3 tests |
| T9 accueil | daf5d4f | index.html, papillon+flammes canvas, reduced-motion, 2 tests |
| T10 grille | (voir log), ca13bb8 | scripts.html, recherche/filtres, fixes revue (textContent, erreur visible) |
| T11 normalise.js | 5d98743 | rendu DOM segments, avatars (portrait→emoji→initiale), texteLisible, 18 tests |

Suite de tests : **43 tests JS + 15 tests Python, tous verts.**

## ✅ Fait — v1 complète (T12-T21, merge `5877196`)

- **T12** Lecteur v1 — `lecture.html` + fil complet de bulles
- **T13** Révélation progressive + machine à écrire (vitesse réglable, reprise)
- **T14** Choix interactifs (sélection cosmétique, lecture linéaire)
- **T15** Comparaison FR/EN (toggle global + par bulle)
- **T16** Dictionnaire (coloration, infobulles, page glossaire, ⚠ incohérence)
- **T17** Éditeur à jetons (jauge octets, caractères interdits, nom_fr éditable)
- **T18** Panier + export Discord
- **T19** Fin de script (✓ relu), navigation, vitesse, export/import sauvegarde
- **T20** À propos, README, **GitHub Pages** (déployé via Actions)
- **T21** Polish UI/UX, responsive, `prefers-reduced-motion`

## ⚙️ Infra repo (2026-06-17)

- **CI** (`.github/workflows/ci.yml`) : `npm test` + tests Python sur push/PR.
- **CD** (`.github/workflows/deploy.yml`) : déploiement GitHub Pages sur `main`.
- **Hooks git** (`.githooks/`, activés par `npm install`) : `pre-push` (tests),
  `commit-msg` (convention de préfixe).
- **Templates** : issues (bug / amélioration) + pull request.

## 🔜 Reste à faire (suivi par les issues GitHub)

- **#1** Captures d'écran du site dans le README
- **#2** Portraits de personnages manquants (détail ci-dessous)
- **#3** Relecture de cohérence du dictionnaire
- **#4** Thème initial selon `prefers-color-scheme`
- **#5** Vérifier le responsive sur appareils réels — non-régression auto en place
  (`e2e/responsive.mjs`, 375/768/1440px), a trouvé et corrigé un débordement de
  `.barre` à 768px

## 🖼️ Portraits à acquérir (priorité haute → basse)

Disponibles (22) :
- depuis personadle (12) : Tatsuya, Maya (=`Maya_A.webp`), Eikichi,
  Lisa (=Ginko), Yukino, Jun, Ulala, Katsuya, Baofu (clé « Colporteur Baofu »),
  Igor, Philémon, Demon Painter.
- ajoutés le 2026-06-16 (10, commit bfedf77) : Roi Lion, Reine Verseau,
  Dame Scorpion, Prince Taureau, Führer, Joker (l'entité), Nyarlathotep,
  Belladonna, Nameless, Kashihara (= Akinari/père de Jun).

**Manquants — liste exhaustive des personnages avec bust-up dans le jeu**
(à ripper/sourcer, puis ajouter dans `img/portraits/` + `data/personnages.json`) :

- 🌑 Cercle masqué & antagonistes : soldats du Cercle (portrait générique),
  Chevaliers de Longinus (portrait générique)
- 🏫 Entourage & lycées :
  **Suguru Mishina** (père d'Eikichi), Kenichi Smith & Mme Smith (parents de Lisa),
  **directeur Hanya**, **Saeko Takami** (Mme Saeko — absente de personadle),
  **Miyabi Hanakouji**, Gou Kameyama (**Toro**), **Yasuo** Mishima,
  Hiroki & Shouichi (Gas Chamber)
- 🗣️ Commerçants & colporteurs : **Daisuke Todoroki** (Chef Todoroki),
  **Toku-san**, Chika Okamura (**Chikarin**), **Trish** (fontaine),
  **Tamaki** Uchida (absente de personadle), **Tadashi Satomi** (pharmacies),
  **Tony**, Garçon Mizuno (Time Castle — notre « Garçon Soejima » ?, à vérifier),
  Mme Shiraishi (ramen), **Kaori**, patron du Gatten Sushi (Père d'Eikichi),
  patron du Mu (Gérant), vendeuse Rosa Candida, Hiiragi (psychothérapie)
- 🌟 Caméos Persona 1 : Maki Sonomura, Kei Nanjo, Eriko (Elly), Hidehiko (Brown),
  Yuka Ayase, Reiji Kido — *certains existent peut-être déjà dans personadle*
- 👤 Spéciaux : les **Ombres** des héros (sprites yeux rouges/peau cendrée :
  Tatsuya Ombre, Maya Ombre, Lisa Ombre, Eikichi Ombre…), variantes enfants
  (Tatsuya/Jun/… enfants)

En attendant : repli emoji → initiale (déjà fonctionnel).

## 🧹 Qualité des données

✅ Fait (2026-07-07, commit `20f77f7` côté P2-FR-IS-PSP + régen `data/`) : les
4 `nom_fr` pollués repérés par les revues (codes bruts en fin de nom,
espaces finaux, nom manquant, préfixe corrompu) sont corrigés à la source ;
les entrées orphelines correspondantes retirées de `data/personnages.json`.

## 💡 Plus tard (v2, hors périmètre actuel)

- MMAP03 et TM_EVE : à ajouter dans `SCRIPTS_SPECIAUX` (`sync.py`) une fois traduits (0 % actuellement)
- Expressions multiples des portraits (joie/colère) si quelqu'un tagge les scènes
- Mode « replay » d'un script avec uniquement les bulles modifiées
