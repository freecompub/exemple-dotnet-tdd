using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// US-2, en cours : chaque scénario pilote <see cref="CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)"/>
/// de bout en bout, source `.skraft/us-2/distill/features/remise-par-palier-de-quantite.feature`.
/// </summary>
public class RemiseParPalierDeQuantiteAcceptanceTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));

    private static PalierDeRemise Palier(int seuilMinimal, decimal taux) =>
        PalierDeRemise.De(Quantite.De(seuilMinimal), taux);

    [Fact] // @ac-1
    public void Ac1_Une_ligne_sous_le_seuil_n_obtient_aucune_remise()
    {
        // Palier « 10 articles ou plus : 5 % »
        var grille = GrilleDeRemise.De([Palier(10, 0.05m)]);
        var panier = new Panier().Ajoute(Ligne("MUG-01", 9, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact] // @ac-2
    public void Ac2_Une_ligne_qui_atteint_le_seuil_obtient_la_remise()
    {
        // Palier « 10 articles ou plus : 5 % »
        var grille = GrilleDeRemise.De([Palier(10, 0.05m)]);
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
    }

    [Fact] // @ac-3
    public void Ac3_Deux_paliers_atteints_seul_le_plus_avantageux_s_applique()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % »
        var grille = GrilleDeRemise.De([Palier(10, 0.05m), Palier(50, 0.12m)]);
        var panier = new Panier().Ajoute(Ligne("MUG-01", 50, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact] // @ac-4
    public void Ac4_La_remise_se_calcule_ligne_par_ligne_jamais_sur_le_panier_entier()
    {
        // Palier « 10 articles ou plus : 5 % » ; deux lignes de 6 articles de références différentes.
        var grille = GrilleDeRemise.De([Palier(10, 0.05m)]);
        var panier = new Panier()
            .Ajoute(Ligne("MUG-01", 6, 2.00m))
            .Ajoute(Ligne("STY-07", 6, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact] // @ac-5
    public void Ac5_Aucun_palier_configure_la_remise_est_nulle()
    {
        var grille = GrilleDeRemise.Vide;
        var panier = new Panier().Ajoute(Ligne("MUG-01", 20, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }
}
