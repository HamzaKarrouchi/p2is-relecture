# -*- coding: utf-8 -*-
"""Génère data/ depuis le repo de traduction. Fonctions pures testables d'abord."""
import re

# Bloc d'intro de locuteur interne (même regex que migration/recover.py, avec capture du nom)
_DELIM = re.compile(
    r'\n?(?:\[(?:U\+)?[0-9A-Fa-f]{4}\]|\[E[1-9]\])*\[E4\]\[NULL\]\[NULL\]"([^\n]*)\n')

# Pause : [1205] suivi d'un code compagnon optionnel
_PAUSE = re.compile(r'\[1205\](?:\[(?:U\+000[0-9A-F]|001E)\])?')
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
