# Spec — Refonte visuelle « Velvet Editorial » × Persona 2: Innocent Sin

**Date :** 2026-06-16
**Branche :** `redesign-velvet-editorial`
**Statut :** validé (design approuvé, prêt pour le plan d'implémentation)

## 1. Objectif

Refondre entièrement la peau du site P2IS Relecture dans la direction **Velvet
Editorial** : un « grimoire de relecture nocturne », sobre, littéraire, à grande
respiration, avec une identité Persona 2: Innocent Sin discrète mais nette.
On garde 100 % des fonctionnalités et du moteur ; on ne change que le visuel,
la structure HTML là où elle le mérite, et on ajoute des animations/popups.

**Contraintes absolues (ne jamais casser) :**

- Moteur de budget d'octets `js/budget.js` : intouché (portage exact de Python).
- Sécurité rendu : jamais d'`innerHTML` avec des données de la traduction
  (labels, noms, textes) — `textContent`/`createElement` uniquement.
- localStorage uniquement via `js/etat.js` (préfixe `p2isr.`).
- Exports Discord : placeholders bruts `[1113]`/`[1112]` conservés.
- Zéro dépendance runtime, zéro build : HTML/CSS/JS vanilla, modules ES, multi-pages.
- Tous les sélecteurs DOM pilotés par le JS existant restent stables (voir §8).

## 2. Concept

« Un grimoire de relecture nocturne. » L'outil se présente comme un livre :
page de titre (frontispice), sommaire chapitré, lecture façon roman-théâtre,
glossaire, colophon. Contraste fort, typographie serif, filets dorés.
Âme Persona via trois couleurs signature : **or « Innocent Sin »**, **braise
« Joker/rumeur »**, **bleu Philémon** (papillon).

## 3. Décisions validées

- **Direction :** Velvet Editorial (minimalisme de lecture, serif).
- **Thème :** bascule **Velvet Nuit ↔ Velvet Jour**, défaut **Nuit**, via le
  bouton `#btn-theme` existant.
- **Papillon de l'accueil :** conservé, **bleu Philémon** (lore-accurate).
- **Approche :** reskin profond + restructuration ciblée des pages
  (accueil / sommaire / lecture). Contrats JS et moteur intacts.

## 4. Palette

### Velvet Nuit (défaut)

| Rôle | Variable | Hex |
|---|---|---|
| Fond encre | `--fond` | `#14110D` |
| Fond secondaire | `--fond2` | `#1B1712` |
| Carte / relief | `--carte` | `#1C1A17` |
| Bordure | `--bord` | `#3A342C` |
| Texte | `--texte` | `#ECE6DC` |
| Texte atténué | `--texte2` | `#A89C88` |
| Or Innocent Sin (accent) | `--accent` | `#C8A24B` |
| Or dictionnaire | `--dico` | `#C8A24B` |
| Braise Joker (héros/rumeur) | `--rouge` / `--heros-bord` | `#B43A3A` |
| Fond bulle héros | `--heros-fond` | `#1F1714` |
| Nom héros | `--heros-nom` | `#E0A6A0` |
| Bleu Philémon (froid, rare) | `--philemon` | `#8FB7FF` |
| Rayon | `--rayon` | `2px` |

### Velvet Jour (parchemin)

| Rôle | Variable | Hex |
|---|---|---|
| Fond parchemin | `--fond` | `#F4ECDC` |
| Fond secondaire | `--fond2` | `#EDE3CF` |
| Carte | `--carte` | `#FBF6EA` |
| Bordure | `--bord` | `#D8C9A8` |
| Texte | `--texte` | `#2A2118` |
| Texte atténué | `--texte2` | `#6B5E45` |
| Or (accent) | `--accent` | `#9A6E22` |
| Braise | `--rouge` | `#A8322E` |
| Bleu Philémon | `--philemon` | `#3E5C9A` |
| Rayon | `--rayon` | `2px` |

Contraste cible : AA minimum partout, AAA sur le corps de lecture.

## 5. Typographie

- **Titres / noms de personnage :** *Cormorant Garamond* (italique pour les
  titres et noms).
- **Corps / dialogues :** *Libre Baskerville*.
- **Auto-hébergement** dans un nouveau dossier `font/` (woff2) + `@font-face`
  dans un nouveau `css/typographie.css` — pas de CDN au runtime (portabilité).
  Repli : `Georgia, "Times New Roman", serif`.
- Tailles fluides en `clamp()`. Interlignage corps 1.6–1.7, longueur de ligne
  bornée (~65–75 caractères).

## 6. Architecture par page

### ① Accueil (`index.html`) — « Frontispice »

- Page de titre : grand titre Cormorant + ornement (glyphe papillon), sous-titre.
- Canvas `#fond` conservé : papillon **bleu Philémon**, recalé sur la palette
  (bleu `#8FB7FF`, lueurs froides) ; flammes adoucies.
- Formulaire `#forme-heros` (prénom/nom) présenté en « ex-libris » encadré de
  filets dorés. Valeurs par défaut `Tatsuya` / `Suou` conservées.
- **Animation de révélation** à la soumission : le portrait
  `img/portraits/Tatsuya.webp` se matérialise (fondu + zoom léger + filet doré),
  le nom saisi s'inscrit en Cormorant sous le portrait, pause ~1,2 s, puis
  `location.href = "scripts.html"`. Court-circuitée si `prefers-reduced-motion`
  (redirection immédiate).
- Liens (Dictionnaire, À propos, Exporter, Importer) en table des matières.

### ② Sommaire (`scripts.html`) — « Table des chapitres »

- Les 399 scripts en index de livre.
- Barre d'outils raffinée : recherche `#q` + filtre `#filtre-perso`, icônes SVG.
- Cartes `.carte-script` redessinées : № en or, titre serif, filet doré révélé
  au survol, sceau ✓ discret pour `.relu`. États `.vide` conservés.
- Bandeau de progression fin « X / 399 relus » (alimenté par `#stats`).

### ③ Lecture (`lecture.html`) — cœur visual novel

- Bulles `.bulle` / `.bulle.heros` plus aérées, filets latéraux braise/or,
  portrait héros agrandi à droite.
- **Marginalia dico** : clic sur `.mot-dico` → popover `.infobulle` restylé
  (réutilise `js/dico.js`).
- **Atelier** (`#panneau-editeur`) : slide-in latéral + voile de fond,
  jetons `.jeton` en pastilles, **jauge d'octets « encrier »**
  (`#ed-jauge` vert→ambre→braise). Validation `#ed-valider`.
- **Carnet** (`#panneau-panier`) : même traitement.
- Micro-animations : apparition des bulles (gardée, raffinée), indicateur
  `#indicateur` pulsé, fondu « page tournée » à l'avancement, transition de thème.
- Carte de fin `#fin` raffinée (actions + navigation `#prec`/`#suiv`).
- Toggle comparaison FR/EN `#cmp` conservé.

### ④ Dictionnaire (`dictionnaire.html`) — « Glossaire »

- Table `#tableau-dico` en deux colonnes serif, lignes alternées subtiles,
  recherche live `#q`, ancres alphabétiques optionnelles.

### ⑤ À propos (`apropos.html`) — « Colophon »

- Prose raffinée façon fin de livre, ornements, crédits, mentions Atlus/SEGA,
  lien Discord.

## 7. Popups & animations

Toutes respectent `prefers-reduced-motion: reduce` (désactivées ou instantanées).

1. Révélation portrait + nom à l'accueil.
2. Marginalia dico (popover).
3. Slide-in atelier/carnet + voile de fond.
4. Toast import/export de sauvegarde (remplace les `alert()`).
5. Survols à filet doré (cartes, liens).
6. Transition de thème en fondu.
7. Papillon canvas conservé (bleu Philémon).
8. (Option, basse priorité) court « ouverture du livre » au tout premier passage.

Implémentées dans des modules JS isolés (par page ou `js/animations.js`),
sans toucher à la logique métier existante.

## 8. Contrats DOM à préserver (pilotés par le JS existant)

IDs : `fond`, `forme-heros`, `prenom`, `nomfam`, `exporter-save`,
`importer-save`, `stats`, `btn-theme`, `q`, `filtre-perso`, `grille`, `fil`,
`titre`, `avancement`, `indicateur`, `fin`, `cmp`, `btn-derouler`, `btn-relu`,
`btn-recommencer`, `btn-panier`, `btn-panier-fin`, `prec`, `suiv`,
`panneau-editeur`, `panneau-panier`, `tableau-dico`, `ed-jauge`, `ed-valider`,
`ed-zone`, `ed-erreurs`, `badge-panier`, `badge-panier-fin`.

Classes produites/lues par le JS : `carte-script`, `relu`, `vide`, `bulle`,
`heros`, `contenu`, `nom`, `choix`, `mot-dico`, `montre-en`, `modifiee`,
`jeton`, `infobulle`, `fr`, `en`, vert/orange/rouge sur `#ed-jauge`.

Ces sélecteurs restent stables ; le CSS est réécrit autour d'eux. De nouveaux
éléments/classes peuvent être ajoutés pour les animations.

## 9. Architecture CSS / fichiers

- `css/commun.css` — réécrit : layout + composants (Velvet).
- `css/theme-nuit.css` — variables **Velvet Nuit**.
- `css/theme-rouge.css` → **renommé `css/theme-jour.css`** — variables **Velvet Jour**.
- `css/accueil.css` — réécrit (frontispice + révélation).
- `css/typographie.css` — **nouveau** : `@font-face` Cormorant/Libre Baskerville.
- Toutes les pages HTML mettent à jour leurs `<link>` en conséquence.

## 10. Impact tests (TDD)

- `tests/theme.test.js` — valeurs `nuit`/`jour`, défaut `nuit` (au lieu de
  `rouge`/`nuit`, défaut `rouge`). MAJ avec le code de `js/theme.js`.
- `tests/accueil.test.js` — MAJ liste des CSS attendus (ajout `typographie.css`,
  remplacement `theme-rouge.css` → `theme-jour.css`). Les assertions
  `value="Tatsuya"`/`"Suou"`, `#fond`, `#forme-heros`, liens : inchangées.
- Tous les autres tests (`budget`, `etat`, `grille`, `lecteur`, `dico`,
  `editeur`, `panier`, `normalise`, `navigation`, Python) : **doivent rester
  verts sans modification** (sélecteurs préservés).

## 11. Responsive

Breakpoints validés à 375 / 768 / 1024 / 1440 px. Mobile : panneaux plein écran
(déjà), barre qui s'enroule, bulles élargies, typo `clamp()`, cibles tactiles
≥ 44 px, grille 1 colonne. Pas de scroll horizontal.

## 12. Icônes

Émojis de chrome (papillon, ☾/☀ thème, stylo, loupe, livre, info) → **SVG inline
(jeu Lucide)**. Les emojis-portraits de personnages (🎭🎤…) restent : ce sont des
avatars de secours légitimes quand `data/personnages.json` n'a pas d'image.

## 13. Hors périmètre (YAGNI)

- Pas de framework, pas de build, pas de web components.
- Pas de refonte du moteur de budget, de `sync.py`, ni du format de `data/`.
- Pas de nouveau backend / compte / réseau.
- L'« ouverture du livre » au premier passage (§7.8) est optionnelle, traitée
  en dernier si le temps le permet.

## 14. Nettoyage

- `maquettes-styles.html` (fichier de prévisualisation jetable) : supprimé en
  fin de chantier.
