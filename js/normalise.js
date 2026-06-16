// Rendu DOM des segments générés par sync.py + helpers texte lisible.

/**
 * Convertit une liste de segments en un nœud <span> DOM.
 * Jamais de innerHTML — sécurité.
 * @param {Array} segments
 * @param {{ prenom: string, nom: string }} heros
 * @returns {HTMLSpanElement}
 */
export function rendreSegments(segments, heros) {
  const racine = document.createElement("span");
  for (const s of segments) {
    if (s.t !== undefined) {
      racine.append(s.t);
    } else if (s.pause) {
      const x = document.createElement("span");
      x.className = "pause";
      x.textContent = "⏸";
      racine.append(x);
    } else if (s.nl) {
      racine.append(document.createElement("br"));
    } else if (s.hero) {
      const x = document.createElement("span");
      x.className = "placeholder-heros";
      x.textContent = s.hero === "prenom" ? heros.prenom : heros.nom;
      x.title = s.hero === "prenom"
        ? "[1113] — prénom du héros"
        : "[1112] — nom du héros";
      racine.append(x);
    } else if (s.enc !== undefined) {
      const x = document.createElement("span");
      x.className = "enc";
      x.textContent = s.enc;
      racine.append(x);
    } else if (s.hl !== undefined) {
      const x = document.createElement("span");
      x.className = "hl";
      x.textContent = s.hl;
      racine.append(x);
    }
  }
  return racine;
}

/**
 * Convertit un texte brut (avec codes jeu) en version lisible une ligne
 * pour l'export Discord : ⏸ pour les pauses, ⏎ pour les sauts de ligne.
 * @param {string} brut
 * @returns {string}
 */
export function texteLisible(brut) {
  return brut
    .replace(/\[1205\](?:\[(?:U\+000[0-9A-Fa-f]|001E)\])?/g, "⏸")
    .replace(/\[SP\]/g, " ")
    .replace(/\n/g, "⏎");
}

/**
 * Crée un élément avatar selon la chaîne portrait → emoji → initiale.
 * Les portraits sont dans img/portraits/, mapping dans data/personnages.json.
 * @param {string} nom
 * @param {{ portrait?: string, emoji?: string, couleur?: string } | null} perso
 * @returns {HTMLDivElement}
 */
export function rendreAvatar(nom, perso) {
  const av = document.createElement("div");
  av.className = "avatar";
  if (perso?.portrait) {
    const img = document.createElement("img");
    img.src = `img/portraits/${perso.portrait}`;
    img.alt = nom;
    img.onerror = () => {
      img.remove();
      av.textContent = perso.emoji || (nom ? nom[0].toUpperCase() : "?");
    };
    av.append(img);
  } else {
    av.textContent = perso?.emoji || (nom ? nom[0].toUpperCase() : "?");
  }
  return av;
}
