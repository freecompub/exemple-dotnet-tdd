using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteTests
{
    [Theory]
    [InlineData(10, 12, 50, 5)]
    [InlineData(50, 5, 10, 12)]
    [InlineData(10, 12, 10, 5)]
    [InlineData(10, 5, 10, 12)]
    public void La_remise_maximale_prime_sur_le_seuil_et_l_ordre_des_paliers(
        int premierSeuil, int premierTaux, int secondSeuil, int secondTaux)
    {
        var panier = PanierDeCinquanteArticles();
        var bareme = BaremeDeRemise.De(
            Palier(premierSeuil, premierTaux),
            Palier(secondSeuil, secondTaux));

        var facture = new CalculDuPanier().Chiffrer(panier, bareme);

        Assert.Equal(Montant.De(12m), facture.Remise);
        Assert.Equal(Montant.De(88m), facture.ATPayer);
    }

    [Theory]
    [InlineData(0, 0, 100)]
    [InlineData(100, 100, 0)]
    public void Les_taux_limites_sont_acceptes_et_appliques(
        int taux, int remiseAttendue, int totalAttendu)
    {
        var facture = ChiffrerAvecTaux(taux);

        Assert.Equal(Montant.De(remiseAttendue), facture.Remise);
        Assert.Equal(Montant.De(totalAttendu), facture.ATPayer);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void Un_taux_hors_de_l_intervalle_autorise_est_rejete(int taux)
    {
        Assert.Throws<ArgumentOutOfRangeException>("pourcentage", () => ChiffrerAvecTaux(taux));
    }

    private static Facture ChiffrerAvecTaux(decimal taux)
    {
        var panier = PanierDeCinquanteArticles();
        var bareme = BaremeDeRemise.De(Palier(10, taux));

        return new CalculDuPanier().Chiffrer(panier, bareme);
    }

    private static Panier PanierDeCinquanteArticles() =>
        new Panier().Ajoute(new LigneDePanier("MUG-01", Quantite.De(50), Montant.De(2m)));

    private static PalierDeRemise Palier(int seuil, decimal taux) =>
        PalierDeRemise.De(Quantite.De(seuil), TauxDeRemise.De(taux));
}
