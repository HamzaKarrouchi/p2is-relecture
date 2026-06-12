import { Etat } from "./etat.js";
import { initTheme } from "./theme.js";
initTheme();
const champPrenom = document.getElementById("prenom");
const champNom = document.getElementById("nomfam");
const h = Etat.get("heros", null);
if (h) { champPrenom.value = h.prenom; champNom.value = h.nom; }
document.getElementById("forme-heros").addEventListener("submit", (ev) => {
  ev.preventDefault();
  Etat.set("heros", { prenom: champPrenom.value.trim() || "Tatsuya",
                      nom: champNom.value.trim() || "Suou" });
  location.href = "scripts.html";
});

// ── Fond animé : papillon bleu + flammes bleues ───────────────────────────
const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
const cv = document.getElementById("fond"), ctx = cv.getContext("2d");
function taille() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener("resize", taille); taille();
const flammes = Array.from({ length: 14 }, () => ({
  x: Math.random() * cv.width, y: cv.height + Math.random() * 200,
  r: 4 + Math.random() * 9, v: .3 + Math.random() * .8, a: Math.random() * 6 }));
let t = 0;
function papillon(x, y, phase) {
  const bat = Math.sin(phase) * .55 + .8;          // battement d'ailes
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(110,180,255,.85)";
  for (const s of [-1, 1]) {                        // deux ailes
    ctx.save(); ctx.scale(s * bat, 1);
    ctx.beginPath(); ctx.ellipse(14, -6, 14, 9, -.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(11, 7, 9, 7, .4, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "rgba(20,40,80,.9)";
  ctx.fillRect(-1.5, -14, 3, 26);                   // corps
  ctx.restore();
}
function boucle() {
  ctx.clearRect(0, 0, cv.width, cv.height); t += .025;
  for (const f of flammes) {                        // flammes bleues montantes
    f.y -= f.v; f.a += .05;
    if (f.y < -20) { f.y = cv.height + 20; f.x = Math.random() * cv.width; }
    const ondule = Math.sin(f.a) * 6;
    const g = ctx.createRadialGradient(f.x + ondule, f.y, 0, f.x + ondule, f.y, f.r * 2.2);
    g.addColorStop(0, "rgba(140,200,255,.5)"); g.addColorStop(1, "rgba(140,200,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(f.x + ondule, f.y, f.r * 2.2, 0, 7); ctx.fill();
  }
  const px = cv.width / 2 + Math.sin(t * .6) * cv.width * .3;
  const py = cv.height * .35 + Math.sin(t * 1.3) * 40;
  papillon(px, py, t * 6);
  requestAnimationFrame(boucle);
}
if (!reduit) boucle();
else { papillon(cv.width / 2, cv.height * .35, 1); } // statique si reduced-motion
