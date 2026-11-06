using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.UnitTests.Features.RemiseParPalier;

public sealed class ChiffrageNetTests
{
    [Fact]
    public void La_remise_du_palier_est_deduite_du_montant_a_payer()
    {
        var panier = new Panier()
            .Ajoute(new LigneDePanier("MUG-01", Quantite.De(10), Montant.De(2.00m)));
        var paliers = PaliersDeRemise.De(
            new PalierDeRemise(Quantite.De(10), TauxDeRemise.De(5m)));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(19.00m), facture.ATPayer);
    }
}
