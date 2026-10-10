using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class CalculDuPanierRemisesTests
{
    [Fact]
    public void Les_remises_de_deux_references_s_additionnent_sur_la_facture()
    {
        var panier = new Panier()
            .Ajoute(new LigneDePanier("MUG-01", Quantite.De(10), Montant.De(2.00m)))
            .Ajoute(new LigneDePanier("STY-07", Quantite.De(20), Montant.De(2.00m)));
        var paliers = new PaliersDeQuantite(new PalierDeQuantite(10, 5m));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(3.00m), facture.Remise);
        Assert.Equal(Montant.De(57.00m), facture.ATPayer);
    }
}
