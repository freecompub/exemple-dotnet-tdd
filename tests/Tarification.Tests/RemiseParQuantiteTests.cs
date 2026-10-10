using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteTests
{
    [Fact]
    public void Modifier_la_collection_source_ne_change_pas_la_remise_configuree()
    {
        var paliers = new List<PalierDeQuantite> { Palier(10, 5m) };
        var grille = new GrilleDePaliers(paliers);
        var panier = PanierDuClient(10, 2.00m);
        var calcul = new CalculDuPanier();
        var factureInitiale = calcul.Chiffrer(panier, grille);
        Assert.Equal(Montant.De(1.00m), factureInitiale.Remise);

        paliers[0] = Palier(10, 12m);
        var factureApresModification = calcul.Chiffrer(panier, grille);

        Assert.Equal(factureInitiale, factureApresModification);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Le_meilleur_taux_prime_sur_le_plus_grand_seuil_et_sur_l_ordre(bool ordreInverse)
    {
        var meilleurPalier = Palier(10, 12m);
        var plusGrandSeuil = Palier(50, 5m);
        var paliers = ordreInverse
            ? new[] { plusGrandSeuil, meilleurPalier }
            : new[] { meilleurPalier, plusGrandSeuil };
        var grille = new GrilleDePaliers(paliers);
        var panier = PanierDuClient(50, 2.00m);

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
        Assert.Equal(Montant.De(100.00m), facture.SommeDesArticles);
        Assert.Equal(Montant.De(88.00m), facture.ATPayer);
    }

    private static PalierDeQuantite Palier(int seuil, decimal pourcentage) =>
        new(Quantite.De(seuil), new TauxDeRemise(pourcentage));

    private static Panier PanierDuClient(int quantite, decimal prix) =>
        new Panier().Ajoute(new LigneDePanier("MUG-01", Quantite.De(quantite), Montant.De(prix)));
}
