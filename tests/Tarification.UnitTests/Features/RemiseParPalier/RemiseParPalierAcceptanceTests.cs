using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.UnitTests.Features.RemiseParPalier;

public sealed class RemiseParPalierAcceptanceTests
{
    [Fact]
    public void Le_client_obtient_la_remise_quand_sa_ligne_atteint_le_palier()
    {
        // Le client obtient la remise quand sa ligne atteint le palier
        var paliers = PaliersDeRemise.De(
            new PalierDeRemise(Quantite.De(10), TauxDeRemise.De(5m)));
        var panier = new Panier()
            .Ajoute(new LigneDePanier("MUG-01", Quantite.De(10), Montant.De(2.00m)));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(1.00m), facture.Remise);
        Assert.Equal(Montant.De(19.00m), facture.ATPayer);
    }

    [Fact]
    public void Le_client_obtient_seulement_le_palier_le_plus_avantageux()
    {
        var paliers = PaliersDeRemise.De(
            new PalierDeRemise(Quantite.De(10), TauxDeRemise.De(5m)),
            new PalierDeRemise(Quantite.De(50), TauxDeRemise.De(12m)));
        var panier = new Panier()
            .Ajoute(new LigneDePanier("MUG-01", Quantite.De(50), Montant.De(2.00m)));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(12.00m), facture.Remise);
        Assert.Equal(Montant.De(88.00m), facture.ATPayer);
    }

    [Fact]
    public void Le_client_n_obtient_aucune_remise_sous_le_seuil_du_palier()
    {
        var paliers = PaliersDeRemise.De(
            new PalierDeRemise(Quantite.De(10), TauxDeRemise.De(5m)));
        var panier = new Panier()
            .Ajoute(new LigneDePanier("MUG-01", Quantite.De(9), Montant.De(2.00m)));

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(0.00m), facture.Remise);
        Assert.Equal(Montant.De(18.00m), facture.ATPayer);
    }
}
