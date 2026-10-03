using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// US-2 : remise par palier de quantité. Tests d'acceptance pilotés par
/// .skraft/us-2/distill/features/remise-par-palier.feature — chaque test porte le tag @ac-n de
/// son critère dans son nom.
/// </summary>
public class RemiseParPalierAcceptanceTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prixUnitaire) =>
        new(reference, Quantite.De(quantite), Montant.De(prixUnitaire));

    // Palier « 10 articles ou plus : 5 % »
    private static GrilleDePaliers GrillePalier10ArticlesOuPlus5Pct() =>
        GrilleDePaliers.De([new Palier(Quantite.De(10), Taux.De(0.05m))]);

    [Fact] // @ac-1
    public void Ac1_Palier_10_articles_ou_plus_5_pct_non_atteint_par_une_ligne_de_9_articles_a_2_00()
    {
        var panier = new Panier().Ajoute(Ligne("MUG-01", 9, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, GrillePalier10ArticlesOuPlus5Pct());

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact] // @ac-2
    public void Ac2_Palier_10_articles_ou_plus_5_pct_atteint_par_une_ligne_de_10_articles_a_2_00()
    {
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, GrillePalier10ArticlesOuPlus5Pct());

        Assert.Equal(Montant.De(1.00m), facture.Remise);
    }

    [Fact] // @ac-3
    public void Ac3_Un_seul_palier_le_plus_avantageux_s_applique_parmi_10_5_pct_et_50_12_pct()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % »
        var grille = GrilleDePaliers.De([
            new Palier(Quantite.De(10), Taux.De(0.05m)),
            new Palier(Quantite.De(50), Taux.De(0.12m)),
        ]);
        var panier = new Panier().Ajoute(Ligne("MUG-01", 50, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact] // @ac-4
    public void Ac4_La_remise_se_calcule_par_ligne_deux_lignes_de_6_articles_ne_declenchent_pas_le_palier_de_10()
    {
        var panier = new Panier()
            .Ajoute(Ligne("MUG-01", 6, 2.00m))
            .Ajoute(Ligne("STY-07", 6, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, GrillePalier10ArticlesOuPlus5Pct());

        Assert.Equal(Montant.Zero, facture.Remise);
    }

    [Fact] // @ac-5
    public void Ac5_Aucun_palier_configure_la_remise_est_de_0_00()
    {
        var panier = new Panier().Ajoute(Ligne("MUG-01", 20, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, GrilleDePaliers.Vide);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }
}
