using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteAcceptanceTests
{
    [Fact]
    public void Ac1_Le_client_ne_recoit_pas_de_remise_sous_le_seuil()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var paliers = Paliers((10, 5m));
        var panier = PanierAvecLigne(9, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac2_Le_client_obtient_la_remise_en_atteignant_le_seuil()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var paliers = Paliers((10, 5m));
        var panier = PanierAvecLigne(10, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
    }

    [Fact]
    public void Ac3_Le_client_beneficie_du_meilleur_palier_sans_cumul()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var paliers = Paliers((10, 5m), (50, 12m));
        var panier = PanierAvecLigne(50, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact]
    public void Ac3_Le_meilleur_palier_ne_depend_pas_de_l_ordre()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var paliers = Paliers((50, 12m), (10, 5m));
        var panier = PanierAvecLigne(50, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact]
    public void Ac3_Le_meilleur_palier_n_est_pas_necessairement_le_plus_grand_seuil()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        // Variante : taux échangés, « 10 : 12 % » et « 50 : 5 % » ; meilleur avantage 12,00 €.
        var paliers = Paliers((10, 12m), (50, 5m));
        var panier = PanierAvecLigne(50, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact]
    public void Ac4_Les_quantites_de_references_differentes_ne_se_cumulent_pas()
    {
        // Deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        var paliers = Paliers((10, 5m));
        var panier = PanierAvecLigne(6, 2.00m).Ajoute(Ligne("STY-07", 6, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier_configure()
    {
        // Aucun palier configuré : remise 0,00 €.
        var paliers = Paliers();
        var panier = PanierAvecLigne(10, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    private static ConfigurationDePaliers Paliers(params (int Seuil, decimal Taux)[] paliers) =>
        new(paliers.Select(palier => new PalierDeQuantite(palier.Seuil, palier.Taux)).ToArray());

    private static Panier PanierAvecLigne(int quantite, decimal prix) =>
        new Panier().Ajoute(Ligne("MUG-01", quantite, prix));

    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));
}
