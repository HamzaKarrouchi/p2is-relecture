import { Etat } from "./etat.js";

export function appliquerTheme(t) {
  if (t !== "nuit" && t !== "jour") t = "nuit";
  document.documentElement.dataset.theme = t;
  Etat.set("theme", t);
}

// Thème de départ : préférence stockée si valide, sinon celle du système.
export function choisirThemeInitial(stocke, prefereClair) {
  if (stocke === "nuit" || stocke === "jour") return stocke;
  return prefereClair ? "jour" : "nuit";
}

function prefereClair() {
  return typeof matchMedia === "function"
    && matchMedia("(prefers-color-scheme: light)").matches;
}

export function initTheme() {
  const stocke = Etat.get("theme", null);
  const t = choisirThemeInitial(stocke, prefereClair());
  if (stocke === "nuit" || stocke === "jour") {
    appliquerTheme(t);                          // choix explicite : applique + persiste
  } else {
    document.documentElement.dataset.theme = t; // auto système : sans persistance
  }
}

export function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "nuit" ? "jour" : "nuit");
}
