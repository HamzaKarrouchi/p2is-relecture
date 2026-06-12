import { Etat } from "./etat.js";

export function appliquerTheme(t) {
  if (t !== "nuit" && t !== "rouge") t = "nuit";
  document.documentElement.dataset.theme = t;
  Etat.set("theme", t);
}

export function initTheme() {
  appliquerTheme(Etat.get("theme", "nuit"));
}

export function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "nuit" ? "rouge" : "nuit");
}
