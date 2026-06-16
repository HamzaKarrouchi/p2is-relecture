import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import extraire_choix

class TestChoix(unittest.TestCase):
    def test_pas_de_menu(self):
        self.assertEqual(extraire_choix("Bonjour."), (None, "Bonjour."))

    def test_menu_simple(self):
        choix, question = extraire_choix(
            "On y va ?\n[1208][0002]Oui\nNon")
        self.assertEqual(question, "On y va ?")
        self.assertEqual(choix["options"], ["Oui", "Non"])

    def test_menu_1432(self):
        choix, question = extraire_choix(
            "Alors ?\n[1208][0002][1432][NULL][NULL][0014]Partir[1432][NULL][NULL][0014]\n"
            "[1432][NULL][NULL][0014]Rester[1432][NULL][NULL][0014]")
        self.assertEqual(question, "Alors ?")
        self.assertEqual(choix["options"], ["Partir", "Rester"])

    def test_menu_options_prefixees(self):
        choix, _ = extraire_choix(
            "Quoi ?\n[1208][U+0003][111F]Bavarder\n[111F][1210][U+0100]Parler boutique\n[111F]Rien")
        self.assertEqual(choix["options"], ["Bavarder", "Parler boutique", "Rien"])

if __name__ == "__main__":
    unittest.main()
