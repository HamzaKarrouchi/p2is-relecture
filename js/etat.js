const PREFIXE = "p2isr.";
let memoire = {};                 // repli si localStorage indisponible

function lireBrut(cle) {
  try { return localStorage.getItem(PREFIXE + cle); }
  catch { return memoire[cle] ?? null; }
}
function ecrireBrut(cle, val) {
  try { localStorage.setItem(PREFIXE + cle, val); }
  catch { memoire[cle] = val; Etat.degrade = true; }
}

export const Etat = {
  degrade: false,
  get(cle, defaut) {
    const v = lireBrut(cle);
    if (v === null) return defaut;
    try { return JSON.parse(v); } catch { return defaut; }
  },
  set(cle, val) { ecrireBrut(cle, JSON.stringify(val)); },

  estRelu(no) { return this.get("relus", []).includes(no); },
  marquerRelu(no, oui) {
    const r = new Set(this.get("relus", []));
    oui ? r.add(no) : r.delete(no);
    this.set("relus", [...r]);
  },

  panier() { return this.get("panier", []); },
  panierAjouter(prop) {
    const p = this.panier().filter(x => !(x.script === prop.script && x.id === prop.id));
    p.push(prop);
    this.set("panier", p);
  },
  panierRetirer(script, id) {
    this.set("panier", this.panier().filter(x => !(x.script === script && x.id === id)));
  },
  panierVider() { this.set("panier", []); },

  exporter() {
    const tout = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(PREFIXE)) tout[k.slice(PREFIXE.length)] = localStorage.getItem(k);
      }
    } catch { Object.assign(tout, memoire); }
    return JSON.stringify(tout);
  },
  importer(json) {
    const tout = JSON.parse(json);
    for (const [k, v] of Object.entries(tout)) ecrireBrut(k, v);
  },
};
