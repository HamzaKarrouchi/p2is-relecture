import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import parser_dictionnaire

ANCIEN_FORMAT = """| Anglais | Français |
|---|---|
| Masked circle | Cercle masqué |
| Last Battalion | Bataillon *(raccourci)* |
"""

NOUVEAU_FORMAT = """| Terme Anglais (Original) | Traduction Française Validée | Remarques & Lore |
|:---|:---|:---|
| **Persona** / **Personas** | Persona / Personae | Invariable au singulier. |
| **Masked circle** | Cercle masqué | |
| **Grand Cross** | Croix Cosmique / Croix | |
"""


class TestParserDictionnaire(unittest.TestCase):
    def test_ancien_format_2_colonnes(self):
        termes = parser_dictionnaire(ANCIEN_FORMAT)
        self.assertEqual(termes, [
            {"en": "Masked circle", "fr": "Cercle masqué"},
            {"en": "Last Battalion", "fr": "Bataillon"},
        ])

    def test_nouveau_format_3_colonnes_avec_gras(self):
        termes = parser_dictionnaire(NOUVEAU_FORMAT)
        self.assertEqual(termes, [
            {"en": "Persona / Personas", "fr": "Persona / Personae"},
            {"en": "Masked circle", "fr": "Cercle masqué"},
            {"en": "Grand Cross", "fr": "Croix Cosmique / Croix"},
        ])

    def test_ignore_ligne_separatrice_et_entete(self):
        termes = parser_dictionnaire("| Anglais | Français |\n|---|---|\n")
        self.assertEqual(termes, [])

    def test_ignore_lignes_hors_tableau(self):
        texte = "# Titre\n\nUn paragraphe.\n\n| Anglais | Français |\n|---|---|\n| Foo | Bar |\n"
        self.assertEqual(parser_dictionnaire(texte), [{"en": "Foo", "fr": "Bar"}])


if __name__ == "__main__":
    unittest.main()
