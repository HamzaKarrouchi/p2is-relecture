import { initTheme, basculerTheme } from "./theme.js";
initTheme();
const btnTheme = document.getElementById("btn-theme");
if (btnTheme) btnTheme.onclick = basculerTheme;
