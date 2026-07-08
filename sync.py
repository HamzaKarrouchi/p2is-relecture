# -*- coding: utf-8 -*-
"""Génère data/ depuis le repo de traduction. Fonctions pures testables d'abord."""
import re
import json
import os
import glob

TRAD = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "..", "Trad_Persona2", "P2-FR-IS-PSP")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

EMOJI_DEFAUT = "💬"

# Bloc d'intro de locuteur interne (même regex que migration/recover.py, avec capture du nom)
_DELIM = re.compile(
    r'\n?(?:\[(?:U\+)?[0-9A-Fa-f]{4}\]|\[E[1-9]\])*\[E4\]\[NULL\]\[NULL\]"([^\n]*)\n')

# Pause : [1205] suivi d'un code compagnon optionnel
_PAUSE = re.compile(r'\[1205\](?:\[(?:U\+000[0-9A-Fa-f]|001E)\])?')
_ENC = re.compile(r'\[1432\]\[NULL\]\[NULL\]\[0014\](.*?)\[1432\]\[NULL\]\[NULL\]\[0014\]', re.S)
_HL = re.compile(r'\[E4\]\[NULL\]\[NULL\]\[U\+0006\](.*?)\[E4\]\[NULL\]\[NULL\]\[0002\]', re.S)
_CODE = re.compile(r'\[[^\]]*\]')

# Marqueurs internes temporaires (zone d'usage privé Unicode U+E000…, jamais dans les textes du jeu)
_M_PAUSE  = ""
_M_NL     = ""
_M_PRENOM = ""
_M_NOM    = ""
_M_ENC_O  = ""
_M_ENC_F  = ""
_M_HL_O   = ""
_M_HL_F   = ""


def en_segments(texte):
    """Texte brut (une bulle) -> liste de segments d'affichage."""
    t = texte.replace("[SP]", " ")
    t = _ENC.sub(lambda m: _M_ENC_O + m.group(1) + _M_ENC_F, t)
    t = _HL.sub(lambda m: _M_HL_O + m.group(1) + _M_HL_F, t)
    t = _PAUSE.sub(_M_PAUSE, t)
    t = t.replace("[1113]", _M_PRENOM).replace("[1112]", _M_NOM)
    t = _CODE.sub("", t)            # tout code restant disparaît de l'affichage
    t = t.replace("\n", _M_NL)
    segs, buf, mode = [], "", None  # mode None|'enc'|'hl'

    def flush():
        nonlocal buf
        if buf:
            segs.append({"enc": buf} if mode == "enc" else
                        {"hl": buf} if mode == "hl" else {"t": buf})
            buf = ""

    for ch in t:
        if ch == _M_PAUSE:  flush(); segs.append({"pause": True})
        elif ch == _M_NL:   flush(); segs.append({"nl": True})
        elif ch == _M_PRENOM: flush(); segs.append({"hero": "prenom"})
        elif ch == _M_NOM:    flush(); segs.append({"hero": "nom"})
        elif ch == _M_ENC_O:  flush(); mode = "enc"
        elif ch == _M_ENC_F:  flush(); mode = None
        elif ch == _M_HL_O:   flush(); mode = "hl"
        elif ch == _M_HL_F:   flush(); mode = None
        else: buf += ch
    flush()
    return segs


def en_bulles(texte):
    """Texte brut complet -> [{nom, seg}] (découpe aux blocs locuteur internes)."""
    morceaux = _DELIM.split(texte)   # [txt0, nom1, txt1, nom2, txt2, …]
    bulles = [{"nom": None, "seg": en_segments(morceaux[0])}]
    for i in range(1, len(morceaux), 2):
        nom = morceaux[i].replace("[SP]", " ").strip()
        bulles.append({"nom": nom, "seg": en_segments(morceaux[i + 1])})
    return [b for b in bulles if b["seg"]]


_MENU = re.compile(r'\[(?:U\+)?1208\](?:\[(?:U\+)?[0-9A-Fa-f]{4}\])?')
_STRUCT_OPT = re.compile(r'\[1432\]|\[NULL\]|\[0014\]|\[111F\]|\[1210\]|\[U\+[0-9A-Fa-f]{4}\]|\[0002\]')

def extraire_choix(texte):
    """-> (choix|None, texte_question). choix = {"options": [str]}.
    La question (avant [1208]) reste à normaliser par l'appelant via en_segments."""
    m = _MENU.search(texte)
    if not m:
        return None, texte
    question = texte[:m.start()].rstrip("\n")
    corps = texte[m.end():]
    options = []
    if "[0014]" in corps:                      # type [1432] : split sur [0014]
        for part in re.split(r'\[0014\]', corps):
            p = _STRUCT_OPT.sub("", part).replace("[SP]", " ").strip("\n").strip()
            if p and "\n" not in p:
                options.append(p)
    else:                                       # type simple : lignes nues
        for line in corps.split("\n"):
            p = _STRUCT_OPT.sub("", line).replace("[SP]", " ").strip()
            if p:
                options.append(p)
    return ({"options": options} if options else None), question


def convertir_entree(e):
    if not str(e.get("texte_orig", "")).strip():
        return None                              # slot vide → ignoré
    brut_fr, brut_en = e.get("texte_fr", ""), e.get("texte_orig", "")
    choix_fr, q_fr = extraire_choix(brut_fr)
    choix_en, q_en = extraire_choix(brut_en)
    if choix_fr: choix_fr["question"] = en_segments(q_fr)
    if choix_en: choix_en["question"] = en_segments(q_en)
    return {
        "id": e["id"],
        "nom_fr": e.get("nom_fr", ""),
        "nom_en": e.get("nom_orig", "").replace("[SP]", " "),
        "bulles_fr": en_bulles(q_fr if choix_fr else brut_fr),
        "bulles_en": en_bulles(q_en if choix_en else brut_en),
        "choix_fr": choix_fr, "choix_en": choix_en,
        "brut_fr": brut_fr, "brut_en": brut_en,
        "data_size": e.get("data_size", 8),
        "budget": e.get("data_size", 8) - 8,
    }


def charger_json(chemin, defaut):
    try:
        with open(chemin, encoding="utf-8") as f: return json.load(f)
    except FileNotFoundError:
        return defaut


def ecrire(chemin, obj):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    tmp = chemin + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1); f.write("\n")
    with open(tmp, encoding="utf-8") as f:       # relecture avant remplacement
        json.load(f)
    os.replace(tmp, chemin)


_ENTETES_DICO = {"Anglais", "Terme Anglais (Original)"}

def parser_dictionnaire(texte):
    """Tableau markdown de Dictionnaire.md (une ou plusieurs sections) -> [{en, fr}].
    Tolère le gras (**terme**) et une 3e colonne libre (remarques), ignorées."""
    termes = []
    _SEPARATEUR = re.compile(r"^:?-+:?$")
    for ligne in texte.splitlines():
        c = [x.strip() for x in ligne.strip().strip("|").split("|")]
        if len(c) < 2 or not c[0] or _SEPARATEUR.match(c[0]):
            continue
        en = re.sub(r"\*\*(.*?)\*\*", r"\1", c[0]).strip()
        if en in _ENTETES_DICO:
            continue
        fr = re.sub(r"\*\(.*?\)\*", "", c[1])           # retire les annotations italiques
        fr = re.sub(r"\*\*(.*?)\*\*", r"\1", fr).strip()  # retire le gras
        termes.append({"en": en, "fr": fr})
    return termes


def generer_dictionnaire():
    chemin = os.path.join(TRAD, "Dictionnaire.md")
    with open(chemin, encoding="utf-8") as fh:
        return parser_dictionnaire(fh.read())


# Scripts hors event_scripts/ (traduction/NOM.json) suffisamment traduits pour
# être lisibles sur le site — numérotés à part (900+) pour ne pas entrer en
# collision avec les script_NNN.json. MMAP03 et TM_EVE sont encore à 0 %
# traduits (cf. python3 sync.py --stats-speciaux) : pas encore inclus.
SCRIPTS_SPECIAUX = {
    900: "CD_SHOP", 901: "F_BE", 902: "MMAP01", 903: "MMAP02",
    905: "MMAP04", 906: "MMAP05", 907: "MMAP06",
}


def traiter_script(no, brutes, labels, persos):
    """Convertit les entrées brutes d'un script (numéroté ou spécial) en
    {no, entrees}, met à jour labels/persos en place, renvoie aussi l'entrée
    d'index et la ligne de recherche."""
    entrees = [c for e in brutes if (c := convertir_entree(e))]
    noms = sorted({e["nom_fr"] for e in entrees if e["nom_fr"]})
    for n in noms:
        persos.setdefault(n, {"emoji": EMOJI_DEFAUT})
    index_entree = {"no": no, "label": labels.get(f"{no:03d}", ""),
                     "personnages": noms, "repliques": len(entrees)}
    ligne_recherche = " ".join(
        seg.get("t") or seg.get("hl") or seg.get("enc") or ""
        for e in entrees for b in e["bulles_fr"] for seg in b["seg"]).lower()
    return entrees, index_entree, ligne_recherche


def main():
    labels = charger_json(os.path.join(DATA, "labels.json"), {})
    persos = charger_json(os.path.join(DATA, "personnages.json"), {})
    index, recherche = [], {}

    for p in sorted(glob.glob(os.path.join(TRAD, "traduction", "event_scripts", "script_*.json"))):
        no = int(re.search(r"(\d+)", os.path.basename(p)).group(1))
        with open(p, encoding="utf-8") as f:
            brutes = json.load(f)
        entrees, index_entree, ligne_recherche = traiter_script(no, brutes, labels, persos)
        ecrire(os.path.join(DATA, "scripts", f"{no:03d}.json"), {"no": no, "entrees": entrees})
        index.append(index_entree)
        recherche[f"{no:03d}"] = ligne_recherche

    for no, nom in sorted(SCRIPTS_SPECIAUX.items()):
        p = os.path.join(TRAD, "traduction", f"{nom}.json")
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            brutes = json.load(f)
        labels.setdefault(f"{no:03d}", nom)   # défaut = identifiant, éditable ensuite
        entrees, index_entree, ligne_recherche = traiter_script(no, brutes, labels, persos)
        ecrire(os.path.join(DATA, "scripts", f"{no:03d}.json"), {"no": no, "entrees": entrees})
        index.append(index_entree)
        recherche[f"{no:03d}"] = ligne_recherche

    ecrire(os.path.join(DATA, "index.json"), index)
    ecrire(os.path.join(DATA, "recherche.json"), recherche)
    ecrire(os.path.join(DATA, "personnages.json"), persos)
    ecrire(os.path.join(DATA, "labels.json"), labels)
    ecrire(os.path.join(DATA, "dictionnaire.json"), generer_dictionnaire())
    print(f"{len(index)} scripts générés")


if __name__ == "__main__":
    main()
