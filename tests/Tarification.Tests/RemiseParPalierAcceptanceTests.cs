using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>US-2 — Remise par palier de quantité.</summary>
public class RemiseParPalierAcceptanceTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));

    private static PalierDeQuantite Palier(int seuil, decimal taux) =>
        new(Quantite.De(seuil), Pourcentage.De(taux));

    [Fact]
    public void Ac2_Une_ligne_de_10_articles_a_2_00_euros_obtient_une_remise_de_1_00_euros()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var grille = GrilleDePaliers.De(Palier(10, 5m));
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier(grille).Chiffrer(panier);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
    }

    [Fact]
    public void Ac1_Une_ligne_de_9_articles_a_2_00_euros_n_obtient_aucune_remise_0_00_euros()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var grille = GrilleDePaliers.De(Palier(10, 5m));
        var panier = new Panier().Ajoute(Ligne("MUG-01", 9, 2.00m));

        var facture = new CalculDuPanier(grille).Chiffrer(panier);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac3_Une_ligne_de_50_articles_a_2_00_euros_obtient_le_palier_le_plus_avantageux_12_00_euros()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var grille = GrilleDePaliers.De(Palier(10, 5m), Palier(50, 12m));
        var panier = new Panier().Ajoute(Ligne("MUG-01", 50, 2.00m));

        var facture = new CalculDuPanier(grille).Chiffrer(panier);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact]
    public void Ac4_Deux_lignes_de_6_articles_de_references_differentes_ne_declenchent_pas_le_palier_de_10()
    {
        // La remise se calcule par ligne : deux lignes de 6 articles, palier de 10 non déclenché.
        var grille = GrilleDePaliers.De(Palier(10, 5m));
        var panier = new Panier()
            .Ajoute(Ligne("MUG-01", 6, 2.00m))
            .Ajoute(Ligne("STY-07", 6, 2.00m));

        var facture = new CalculDuPanier(grille).Chiffrer(panier);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac5_Sans_aucun_palier_configure_la_remise_est_de_0_00_euros()
    {
        // Aucun palier configuré : remise 0,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier(GrilleDePaliers.De()).Chiffrer(panier);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }
}
