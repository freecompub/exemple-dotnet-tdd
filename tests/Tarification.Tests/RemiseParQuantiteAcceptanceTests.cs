using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteAcceptanceTests
{
    [Fact]
    public void Ac2_Une_ligne_au_seuil_recoit_la_remise_deduite_du_total()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));
        var bareme = BaremeDeRemise.De(Palier(10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
        Assert.Equal(Montant.De(20.00m), facture.SommeDesArticles);
        Assert.Equal(Montant.Zero, facture.FraisDePort);
        Assert.Equal(Montant.De(19.00m), facture.ATPayer);
    }

    [Fact]
    public void Ac3_Seul_le_palier_le_plus_avantageux_est_applique()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 50, 2.00m));
        var bareme = BaremeDeRemise.De(Palier(10, 5m), Palier(50, 12m));

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
        Assert.Equal(Montant.De(100.00m), facture.SommeDesArticles);
        Assert.Equal(Montant.Zero, facture.FraisDePort);
        Assert.Equal(Montant.De(88.00m), facture.ATPayer);
    }

    [Fact]
    public void Ac1_Une_ligne_sous_le_seuil_ne_recoit_pas_de_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 9, 2.00m));
        var bareme = BaremeDeRemise.De(Palier(10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.Zero, facture.Remise);
    }

    [Fact]
    public void Ac4_Deux_references_ne_cumulent_pas_leurs_quantites()
    {
        // Deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        var panier = new Panier()
            .Ajoute(Ligne("MUG-01", 6, 2.00m))
            .Ajoute(Ligne("STY-07", 6, 2.00m));
        var bareme = BaremeDeRemise.De(Palier(10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.Zero, facture.Remise);
    }

    [Fact]
    public void Ac5_Un_bareme_vide_ne_donne_aucune_remise()
    {
        // Aucun palier configuré : remise 0,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));
        var bareme = BaremeDeRemise.De();

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.Zero, facture.Remise);
    }

    [Fact]
    public void Ac5_L_appel_sans_bareme_ne_donne_aucune_remise()
    {
        // Aucun palier configuré : remise 0,00 €.
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier);

        Assert.Equal(Montant.Zero, facture.Remise);
    }

    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));

    private static PalierDeRemise Palier(int seuil, decimal pourcentage) =>
        PalierDeRemise.De(Quantite.De(seuil), TauxDeRemise.De(pourcentage));
}
