import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import en_bulles, en_segments

class TestSegments(unittest.TestCase):
    def test_texte_simple(self):
        self.assertEqual(en_segments("Oui."), [{"t": "Oui."}])

    def test_sp_devient_espace(self):
        self.assertEqual(en_segments("Bonjour[SP]toi"), [{"t": "Bonjour toi"}])

    def test_pause_et_saut(self):
        segs = en_segments("Attends...[1205][U+000F][SP]quoi ?\nNon !")
        self.assertEqual(segs, [{"t": "Attends..."}, {"pause": True},
                                {"t": " quoi ?"}, {"nl": True}, {"t": "Non !"}])

    def test_pause_variantes(self):
        self.assertEqual(en_segments("a[1205][001E]b"),
                         [{"t": "a"}, {"pause": True}, {"t": "b"}])

    def test_placeholders_heros(self):
        self.assertEqual(en_segments("Salut[SP][1113][SP][1112] !"),
                         [{"t": "Salut "}, {"hero": "prenom"}, {"t": " "},
                          {"hero": "nom"}, {"t": " !"}])

    def test_encadre_1432(self):
        segs = en_segments("Choisis[SP][1432][NULL][NULL][0014]Armes[1432][NULL][NULL][0014][SP]ici")
        self.assertEqual(segs, [{"t": "Choisis "}, {"enc": "Armes"}, {"t": " ici"}])

    def test_surligne_E4(self):
        segs = en_segments("le[SP][E4][NULL][NULL][U+0006]Taxi[SP]Maudit[E4][NULL][NULL][0002][SP]existe")
        self.assertEqual(segs, [{"t": "le "}, {"hl": "Taxi Maudit"}, {"t": " existe"}])

    def test_codes_inconnus_ignores(self):
        self.assertEqual(en_segments("a[E1][E2][U+0159]b"), [{"t": "ab"}])

    def test_exemple_reel_script134(self):
        """Exemple réel script_134 id=5 : vérifie la cohérence hl/pause/enc/t."""
        texte = (
            'A[SP][E4][NULL][NULL][U+0006]Raspberry[SP]flower[E4][NULL][NULL][0002]'
            '...[1205][001E][SP][1432][NULL][NULL][0014]Regret[1432][NULL][NULL][0014]'
            '...[1205][001E][SP]Deep[SP]down,\nJun-kun[SP]knows[SP]all[SP]this[SP]already...'
        )
        segs = en_segments(texte)
        # Structure attendue : t("A ") hl("Raspberry flower") t("...") pause t(" ") enc("Regret") t("...") pause t(" Deep down,") nl t("Jun-kun knows all this already...")
        self.assertEqual(segs, [
            {"t": "A "},
            {"hl": "Raspberry flower"},
            {"t": "..."},
            {"pause": True},
            {"t": " "},
            {"enc": "Regret"},
            {"t": "..."},
            {"pause": True},
            {"t": " Deep down,"},
            {"nl": True},
            {"t": "Jun-kun knows all this already..."},
        ])

class TestBulles(unittest.TestCase):
    def test_sans_bloc_une_bulle(self):
        self.assertEqual(en_bulles("Texte[SP]simple"),
                         [{"nom": None, "seg": [{"t": "Texte simple"}]}])

    def test_bloc_locuteur_interne(self):
        t = 'Question ?[E1][E2]\n[E3][E4][NULL][NULL]"Mme[SP]Saeko\nSuite.'
        self.assertEqual(en_bulles(t), [
            {"nom": None, "seg": [{"t": "Question ?"}]},
            {"nom": "Mme Saeko", "seg": [{"t": "Suite."}]}])

if __name__ == "__main__":
    unittest.main()
