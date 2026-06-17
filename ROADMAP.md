# ROADMAP — P2IS Relecture

**Site déployé** sur GitHub Pages : <https://hamzakarrouchi.github.io/p2is-relecture/>
· dépôt <https://github.com/HamzaKarrouchi/p2is-relecture> · branche `main`.

État actuel : **v1 complète (T1-T21)** + **refonte visuelle Velvet Editorial** +
**infra repo** (CI/CD, hooks, issues). Suite de tests : **97 tests JS + 15 tests
Python, tous verts.**

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
- **#5** Vérifier le responsive sur appareils réels

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

## 🧹 Qualité des données (repérées par les revues, à corriger côté repo de TRAD)

`data/personnages.json` révèle des `nom_fr` sales dans `traduction/event_scripts/` :
- `"Voix de Ginko[E4][NULL][NULL][0002]"` — codes bruts dans un nom_fr
- `"Ginko "` et `"Principal "` — espaces finaux
- `"[NULL][E4][NULL][NULL]\"Eikichi"` — nom corrompu

→ À corriger dans `Trad_Persona2/P2-FR-IS-PSP` (passe d'harmonisation), puis `python3 sync.py`.

## 💡 Plus tard (v2, hors périmètre actuel)

- Édition des champs `question_fr`/`choix_fr` dédiés des menus
- Couvrir MMAP01-06, CD_SHOP, F_BE, TM_EVE quand ils seront traduits
- Expressions multiples des portraits (joie/colère) si quelqu'un tagge les scènes
- Mode « replay » d'un script avec uniquement les bulles modifiées
