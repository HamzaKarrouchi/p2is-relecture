# Contribuer à la relecture — P2IS Relecture

Merci de vouloir relire la traduction française de *Persona 2: Innocent Sin* !
Ce guide s'adresse aux **relecteurs** (pas de code à écrire). Pour contribuer
directement à la traduction (nouveaux scripts), voir plutôt
[P2-FR-IS-PSP](https://github.com/chenetulipe/P2-FR-IS-PSP).

## 1. Lire

Ouvre le site, choisis un script dans le sommaire et lis-le comme un visual
novel. Le fil défile bulle par bulle (clic ou Espace), avec le prénom/nom que
tu as choisi à l'accueil à la place de `[1113]`/`[1112]`.

- Le bouton 🔁 sur une bulle affiche la version anglaise en regard.
- Un terme souligné en couleur vient du glossaire (survole-le, ou clique pour
  ouvrir sa fiche dans le dictionnaire).
- Une ⚠ à côté d'un nom signale une incohérence FR/EN détectée automatiquement
  avec le glossaire.

## 2. Proposer une correction

Clique sur le ✏️ d'une bulle (ou d'un bloc de réponses) pour ouvrir l'éditeur :

- Le texte est édité comme des **jetons** : les pastilles (⏎ saut de ligne,
  ⏸ pause, `[1113]`…) sont des codes techniques du jeu, elles ne se modifient
  pas — seul le texte libre autour est éditable.
- Pour un **menu de choix**, la question reste gelée (affichée en lecture
  seule) : seules les réponses du joueur sont modifiables.
- Une **jauge d'octets** s'affiche en direct (vert/orange/rouge) : le texte
  français doit tenir dans l'espace binaire réservé par le jeu (`slot_size`).
  Le bouton « Proposer cette modification » reste désactivé tant que le
  budget est dépassé ou qu'un caractère non supporté est utilisé.

Chaque proposition validée part dans ton **panier** (icône 📋 dans la barre),
sans rien envoyer nulle part pour l'instant — tout reste dans ton navigateur
(`localStorage`).

## 3. Envoyer tes propositions

Ouvre le panier et clique **« Créer une issue GitHub »** : ça ouvre un nouvel
onglet vers une issue pré-remplie sur
[HamzaKarrouchi/P2-FR-IS-PSP](https://github.com/HamzaKarrouchi/P2-FR-IS-PSP/issues/new)
(le dépôt de traduction utilisé par ce site), avec toutes tes propositions
groupées et lisibles. Il ne reste qu'à cliquer « Submit new issue » — un
compte GitHub suffit, pas besoin d'être contributeur du dépôt.

- Si le panier est trop volumineux, il est automatiquement scindé en
  plusieurs issues.
- Si la pop-up est bloquée par le navigateur, des liens cliquables
  apparaissent dans le panneau.
- Le bouton **« Copier »** reste disponible en repli (texte brut, à coller où
  tu veux — Discord, un fichier, une autre issue…).

## 4. Après l'envoi

Les issues sont ensuite relues et, si elles sont retenues, appliquées
directement dans les fichiers de traduction (`texte_fr`) du dépôt
P2-FR-IS-PSP, puis le site est régénéré (`python3 sync.py`) pour les
répercuter ici. Tu peux vider ton panier une fois l'issue créée.

## Bon à savoir

- Rien n'est envoyé automatiquement : tant que tu n'as pas cliqué sur
  « Créer une issue GitHub » (ou copié le texte), tes propositions restent
  strictement locales à ton navigateur.
- Vider le cache/l'historique de ton navigateur efface ton panier et ta
  progression de lecture — pense à exporter avant si tu as des propositions
  en attente.
