using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteAcceptanceTests
{
    [Fact]
    public void Ac1_Une_ligne_sous_le_seuil_ne_recoit_pas_de_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var panier = CreerPanier(("MUG-01", 9, 2.00m));
        var paliers = CreerPaliers((10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac2_Une_ligne_au_seuil_obtient_la_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var panier = CreerPanier(("MUG-01", 10, 2.00m));
        var paliers = CreerPaliers((10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
        Assert.Equal(Montant.De(19.00m), facture.ATPayer); // 19,00 € selon le contrat de conception.
    }

    [Fact]
    public void Ac3_Un_seul_palier_le_plus_avantageux_s_applique()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        // Un seul palier s'applique, le plus avantageux.
        var panier = CreerPanier(("MUG-01", 50, 2.00m));
        var paliers = CreerPaliers((10, 5m), (50, 12m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
        Assert.Equal(Montant.De(88.00m), facture.ATPayer); // 88,00 € selon le contrat de conception.
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Ac3_Le_seuil_inferieur_plus_avantageux_gagne_dans_les_deux_ordres(bool ordreInverse)
    {
        // Critère : « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        // Variante : « 5 : 15 % » donne 15,00 €, davantage que les deux autres paliers atteints.
        var panier = CreerPanier(("MUG-01", 50, 2.00m));
        var paliers = ordreInverse
            ? CreerPaliers((50, 12m), (10, 5m), (5, 15m))
            : CreerPaliers((5, 15m), (10, 5m), (50, 12m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(15.00m), facture.Remise);
        Assert.Equal(Montant.De(85.00m), facture.ATPayer); // 85,00 € après la seule remise de 15,00 €.
    }

    [Fact]
    public void Ac4_Deux_references_ne_cumulent_pas_leurs_quantites()
    {
        // La remise se calcule par ligne, jamais sur le panier entier :
        // deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        // Montage : « 10 articles ou plus : 5 % », prix 2,00 €, remise 0,00 €.
        var panier = CreerPanier(("MUG-01", 6, 2.00m), ("STY-07", 6, 2.00m));
        var paliers = CreerPaliers((10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac5_Aucun_palier_configure_ne_donne_de_remise()
    {
        // Aucun palier configuré : remise 0,00 €.
        var panier = CreerPanier(("MUG-01", 10, 2.00m)); // Ligne de 10 articles à 2,00 €.
        var paliers = CreerPaliers();

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    private static Panier CreerPanier(params (string Reference, int Quantite, decimal Prix)[] lignes)
    {
        var panier = new Panier();
        foreach (var ligne in lignes)
        {
            panier.Ajoute(new LigneDePanier(ligne.Reference, Quantite.De(ligne.Quantite), Montant.De(ligne.Prix)));
        }

        return panier;
    }

    private static PaliersDeQuantite CreerPaliers(params (int Seuil, decimal Pourcentage)[] paliers) =>
        new(paliers.Select(palier => new PalierDeQuantite(palier.Seuil, palier.Pourcentage)).ToArray());
}
