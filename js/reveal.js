// Révélation du protagoniste (portrait + nom) avant d'entrer dans la relecture.
// Aucune donnée HTML : on utilise createElement/textContent uniquement.
export function dureeRevele(reduit) { return reduit ? 0 : 2200; }

export function construireRevele({ prenom, nom, portrait }) {
  const ov = document.createElement("div");
  ov.id = "revele";
  const cadre = document.createElement("div");
  cadre.className = "cadre";
  const img = document.createElement("img");
  img.src = portrait; img.alt = "";
  cadre.appendChild(img);
  const titre = document.createElement("div");
  titre.className = "nom-revele";
  titre.textContent = [prenom, nom].filter(Boolean).join(" ");
  ov.append(cadre, titre);
  document.body.appendChild(ov);
  return ov;
}
