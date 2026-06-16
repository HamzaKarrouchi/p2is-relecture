// Petit toast non bloquant (remplace alert). textContent uniquement.
export function toast(message, { erreur = false, duree = 3200 } = {}) {
  let zone = document.getElementById("zone-toast");
  if (!zone) { zone = document.createElement("div"); zone.id = "zone-toast"; document.body.appendChild(zone); }
  const el = document.createElement("div");
  el.className = "toast" + (erreur ? " erreur" : "");
  el.textContent = message;
  zone.appendChild(el);
  setTimeout(() => { el.remove(); if (!zone.children.length) zone.remove(); }, duree);
  return el;
}
