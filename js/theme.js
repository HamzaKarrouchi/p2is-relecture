import { Etat } from "./etat.js";

export function appliquerTheme(t) {
  if (t !== "nuit" && t !== "rouge") t = "rouge";
  document.documentElement.dataset.theme = t;
  Etat.set("theme", t);
}

export function initTheme() {
  appliquerTheme(Etat.get("theme", "rouge"));
}

export function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "rouge" ? "nuit" : "rouge");
}
