using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// Correction de revue (quality-gates#1.1) : `Facture.ATPayer` combine la somme des articles, la
/// remise et les frais de port (opérateur `+` et `Montant.Soustrait`). Ce test entre par le cas
/// d'usage applicatif `CalculDuPanier.Chiffrer`, seule frontière autorisée (Mandat 1), et observe
/// `ATPayer` avec une remise non nulle pour exercer ces deux chemins.
/// </summary>
public class FactureTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prixUnitaire) =>
        new(reference, Quantite.De(quantite), Montant.De(prixUnitaire));

    [Fact]
    public void A_payer_est_la_somme_des_articles_moins_la_remise()
    {
        var grille = GrilleDePaliers.De([new Palier(Quantite.De(10), Taux.De(0.05m))]);
        var panier = new Panier().Ajoute(Ligne("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        Assert.Equal(Montant.De(19.00m), facture.ATPayer);
    }
}
