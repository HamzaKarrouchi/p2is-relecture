import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync import traiter_script, SCRIPTS_SPECIAUX

BRUTES = [
    {"id": 0, "offset": 0, "data_size": 20, "nom_orig": "Employee",
     "texte_orig": "Hi[SP]there.", "nom_fr": "Employé", "texte_fr": "Salut."},
    {"id": 1, "offset": 0, "data_size": 20, "nom_orig": "Employee",
     "texte_orig": "Bye.", "nom_fr": "Employé", "texte_fr": ""},   # pas encore traduit
    {"id": 2, "offset": 0, "data_size": 20, "nom_orig": "", "texte_orig": "",
     "nom_fr": "", "texte_fr": ""},   # slot vide, ignoré
]


class TestScriptsSpeciaux(unittest.TestCase):
    def test_numerotation_reservee_900_plus_sans_collision(self):
        self.assertTrue(all(no >= 900 for no in SCRIPTS_SPECIAUX))
        self.assertEqual(len(SCRIPTS_SPECIAUX), len(set(SCRIPTS_SPECIAUX.values())))

    def test_mmap03_et_tm_eve_pas_encore_inclus(self):
        self.assertNotIn("MMAP03", SCRIPTS_SPECIAUX.values())
        self.assertNotIn("TM_EVE", SCRIPTS_SPECIAUX.values())

    def test_traiter_script_meme_pipeline_que_les_scripts_numerotes(self):
        labels, persos = {}, {}
        entrees, index_entree, ligne_recherche = traiter_script(900, BRUTES, labels, persos)
        self.assertEqual(len(entrees), 2)              # le slot vide (id 2) est filtré
        self.assertEqual(index_entree, {"no": 900, "label": "", "personnages": ["Employé"], "repliques": 2})
        self.assertIn("Employé", persos)
        self.assertIn("salut", ligne_recherche.lower())

    def test_label_par_defaut_si_absent(self):
        labels, persos = {}, {}
        labels.setdefault("900", "CD_SHOP")
        _, index_entree, _ = traiter_script(900, BRUTES, labels, persos)
        self.assertEqual(index_entree["label"], "CD_SHOP")

    def test_label_existant_preserve(self):
        labels, persos = {"900": "Boutique de CDs"}, {}
        _, index_entree, _ = traiter_script(900, BRUTES, labels, persos)
        self.assertEqual(index_entree["label"], "Boutique de CDs")


if __name__ == "__main__":
    unittest.main()
