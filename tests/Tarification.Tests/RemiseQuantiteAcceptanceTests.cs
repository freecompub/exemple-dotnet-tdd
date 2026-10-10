using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseQuantiteAcceptanceTests
{
    [Fact]
    public void Ac1_Le_client_reste_sous_le_seuil()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var commande = new ChiffrageBuilder().AvecPalier(10, 5m).AvecLigne("MUG-01", 9, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 18.00m, 0.00m, 18.00m);
    }

    [Fact]
    public void Ac2_Le_client_atteint_le_seuil_et_paie_le_montant_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var commande = new ChiffrageBuilder().AvecPalier(10, 5m).AvecLigne("MUG-01", 10, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 20.00m, 1.00m, 19.00m);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Ac3_Le_client_obtient_un_seul_palier_independamment_de_l_ordre(bool ordreInverse)
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var commande = new ChiffrageBuilder().AvecLigne("MUG-01", 50, 2.00m);
        if (ordreInverse)
            commande.AvecPalier(50, 12m).AvecPalier(10, 5m);
        else
            commande.AvecPalier(10, 5m).AvecPalier(50, 12m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 100.00m, 12.00m, 88.00m);
    }

    [Fact]
    public void Ac3_Le_client_obtient_le_meilleur_taux_et_non_le_plus_grand_seuil()
    {
        // Critère : « 10 : 5 % » et « 50 : 12 % », 50 articles à 2,00 € : remise 12,00 €.
        // Variante : « 10 : 12 % » et « 50 : 5 % » donnent aussi 12,00 €.
        var commande = new ChiffrageBuilder()
            .AvecPalier(10, 12m).AvecPalier(50, 5m).AvecLigne("MUG-01", 50, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 100.00m, 12.00m, 88.00m);
    }

    [Fact]
    public void Ac4_Le_client_ne_cumule_pas_les_quantites_des_references()
    {
        // Deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        var commande = new ChiffrageBuilder().AvecPalier(10, 5m)
            .AvecLigne("MUG-01", 6, 2.00m).AvecLigne("STY-07", 6, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 24.00m, 0.00m, 24.00m);
    }

    [Fact]
    public void Ac4_Le_client_cumule_les_remises_de_lignes_eligibles_avec_le_meme_bareme()
    {
        // Critère : deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        // Variante éligible : deux lignes de 10 articles à 2,00 €, remise totale 2,00 €, à payer 38,00 €.
        var commande = new ChiffrageBuilder().AvecPalier(10, 5m)
            .AvecLigne("MUG-01", 10, 2.00m).AvecLigne("STY-07", 10, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 40.00m, 2.00m, 38.00m);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier(bool baremeFourni)
    {
        // Aucun palier configuré : remise 0,00 €. Ligne de 10 articles à 2,00 €, à payer 20,00 €.
        var commande = new ChiffrageBuilder().AvecLigne("MUG-01", 10, 2.00m);

        var facture = baremeFourni ? commande.Chiffrer() : commande.ChiffrerSansBareme();

        VerifierFacture(facture, 20.00m, 0.00m, 20.00m);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Ac5_Le_client_obtient_une_facture_nulle_pour_un_panier_vide(bool avecPalier)
    {
        // Aucun palier configuré : remise 0,00 € ; panier vide, avec ou sans « 10 articles ou plus : 5 % ».
        var commande = new ChiffrageBuilder();
        if (avecPalier)
            commande.AvecPalier(10, 5m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 0.00m, 0.00m, 0.00m);
    }

    [Theory]
    [InlineData(0, 0, 2)]
    [InlineData(100, 2, 0)]
    public void Ac2_Le_client_utilise_les_taux_limites_des_le_premier_article(
        int taux, int remise, int aPayer)
    {
        // Critère : « 10 articles ou plus : 5 % », 10 articles à 2,00 € : remise 1,00 €.
        // Clarification : seuil 1 valide, taux 0 % et 100 % autorisés.
        // 0 % : remise 0,00 €, à payer 2,00 € ; 100 % : remise 2,00 €, à payer 0,00 €.
        var commande = new ChiffrageBuilder().AvecPalier(1, taux).AvecLigne("MUG-01", 1, 2.00m);

        var facture = commande.Chiffrer();

        VerifierFacture(facture, 2.00m, remise, aPayer);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_invalide(int seuil)
    {
        // « 10 : 5 % » et « 50 : 12 % », 50 articles à 2,00 € : remise 12,00 € si le barème est valide.
        // Clarification : rejeter les seuils ≤ 0, exemples 0 et -1.
        var commande = CommandeAvecDeuxPaliers().AvecPalier(seuil, 5m);

        Assert.Throws<ArgumentOutOfRangeException>(() => commande.Chiffrer());
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_taux_hors_bornes(int taux)
    {
        // « 10 : 5 % » et « 50 : 12 % », 50 articles à 2,00 € : remise 12,00 € si le barème est valide.
        // Clarification : rejeter les taux hors [0,100] %, exemples -1 et 101.
        var commande = CommandeAvecDeuxPaliers().AvecPalier(1, taux);

        Assert.Throws<ArgumentOutOfRangeException>(() => commande.Chiffrer());
    }

    [Theory]
    [InlineData(5)]
    [InlineData(12)]
    public void Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_duplique(int taux)
    {
        // « 10 : 5 % » et « 50 : 12 % », 50 articles à 2,00 € : remise 12,00 € si le barème est valide.
        // Clarification : rejeter les seuils dupliqués ; seuil 10, taux identique 5 % ou différent 12 %.
        var commande = CommandeAvecDeuxPaliers().AvecPalier(10, taux);

        Assert.Throws<ArgumentException>(() => commande.Chiffrer());
    }

    private static ChiffrageBuilder CommandeAvecDeuxPaliers() =>
        new ChiffrageBuilder().AvecPalier(10, 5m).AvecPalier(50, 12m).AvecLigne("MUG-01", 50, 2.00m);

    private static void VerifierFacture(Facture facture, decimal somme, decimal remise, decimal aPayer)
    {
        Assert.Equal(Montant.De(remise), facture.Remise);
        Assert.Equal(Montant.De(somme), facture.SommeDesArticles);
        Assert.Equal(Montant.Zero, facture.FraisDePort);
        Assert.Equal(Montant.De(aPayer), facture.ATPayer);
    }

    private sealed class ChiffrageBuilder
    {
        private readonly Panier _panier = new();
        private readonly List<(int Seuil, decimal Taux)> _paliers = [];

        public ChiffrageBuilder AvecLigne(string reference, int quantite, decimal prix)
        {
            _panier.Ajoute(new LigneDePanier(reference, Quantite.De(quantite), Montant.De(prix)));
            return this;
        }

        public ChiffrageBuilder AvecPalier(int seuil, decimal taux)
        {
            _paliers.Add((seuil, taux));
            return this;
        }

        public Facture Chiffrer()
        {
            var paliers = _paliers.Select(p => new PalierDeRemise(p.Seuil, new TauxDeRemise(p.Taux))).ToArray();
            return new CalculDuPanier().Chiffrer(_panier, new BaremeDeRemise(paliers));
        }

        public Facture ChiffrerSansBareme() => new CalculDuPanier().Chiffrer(_panier);
    }
}
