using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemisePlusieursLignesAcceptanceTests
{
    [Fact]
    public void Ac4_Le_client_recoit_la_somme_des_remises_de_chaque_ligne_eligible()
    {
        // La remise se calcule par ligne : deux lignes de 6 articles de références différentes
        // ne déclenchent pas le palier de 10. Variante éligible : deux lignes de 10 articles
        // à 2,00 €, palier « 10 articles ou plus : 5 % » : remise totale 2,00 €.
        var paliers = PaliersCommuns();
        var panier = PanierAvecDeuxLignesEligibles();

        var facture = new CalculDuPanier().Chiffrer(panier, paliers);

        Assert.Equal(Montant.De(2.00m), facture.Remise);
    }

    private static ConfigurationDePaliers PaliersCommuns() =>
        new(new[] { new PalierDeQuantite(10, 5m) });

    private static Panier PanierAvecDeuxLignesEligibles() =>
        new Panier().Ajoute(LigneEligible("MUG-01")).Ajoute(LigneEligible("STY-07"));

    private static LigneDePanier LigneEligible(string reference) =>
        new(reference, Quantite.De(10), Montant.De(2.00m));
}
