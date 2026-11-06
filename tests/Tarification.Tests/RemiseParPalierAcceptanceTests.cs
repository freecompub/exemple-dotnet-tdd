using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>US-2 — Remise par palier de quantité. Point d'entrée : <see cref="CalculDuPanier.Chiffrer"/>.</summary>
public class RemiseParPalierAcceptanceTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));

    private static PalierDeQuantite Palier(int seuil, decimal taux) =>
        PalierDeQuantite.De(Quantite.De(seuil), Pourcentage.De(taux));

    [Fact]
    public void Ac1_Une_ligne_sous_le_seuil_n_obtient_aucune_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var calcul = new CalculDuPanier(GrilleDeRemise.De(Palier(10, 5m)));

        var facture = calcul.Chiffrer(new Panier().Ajoute(Ligne("MUG-01", 9, 2.00m)));

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac2_Une_ligne_qui_atteint_le_seuil_obtient_la_remise_du_palier()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var calcul = new CalculDuPanier(GrilleDeRemise.De(Palier(10, 5m)));

        var facture = calcul.Chiffrer(new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m)));

        Assert.Equal(Montant.De(1.00m), facture.Remise);
    }

    [Fact]
    public void Ac3_Un_seul_palier_s_applique_le_plus_avantageux()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var calcul = new CalculDuPanier(GrilleDeRemise.De(Palier(10, 5m), Palier(50, 12m)));

        var facture = calcul.Chiffrer(new Panier().Ajoute(Ligne("MUG-01", 50, 2.00m)));

        Assert.Equal(Montant.De(12.00m), facture.Remise);
    }

    [Fact]
    public void Ac4_La_remise_se_calcule_par_ligne_jamais_sur_le_panier_entier()
    {
        // Deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        var calcul = new CalculDuPanier(GrilleDeRemise.De(Palier(10, 5m)));
        var panier = new Panier().Ajoute(Ligne("MUG-01", 6, 2.00m)).Ajoute(Ligne("STY-07", 6, 2.00m));

        var facture = calcul.Chiffrer(panier);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }

    [Fact]
    public void Ac5_Sans_palier_configure_aucune_remise()
    {
        // Aucun palier configuré : remise 0,00 €.
        var calcul = new CalculDuPanier(GrilleDeRemise.Vide);

        var facture = calcul.Chiffrer(new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m)));

        Assert.Equal(Montant.De(0.00m), facture.Remise);
    }
}
