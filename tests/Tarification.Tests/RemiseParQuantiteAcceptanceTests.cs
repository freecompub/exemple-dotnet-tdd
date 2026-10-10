using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

public class RemiseParQuantiteAcceptanceTests
{
    [Fact]
    public void Ac1_Le_client_reste_juste_en_dessous_du_seuil()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
        var grille = ConfigurerPaliers((10, 5m));
        var panier = PanierDuClient(("MUG-01", 9, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        VerifierFacture(facture, brut: 18.00m, remise: 0.00m, aPayer: 18.00m);
    }

    [Fact]
    public void Ac2_Le_client_atteint_le_seuil_de_remise()
    {
        // Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
        var grille = ConfigurerPaliers((10, 5m));
        var panier = PanierDuClient(("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        VerifierFacture(facture, brut: 20.00m, remise: 1.00m, aPayer: 19.00m);
    }

    [Fact]
    public void Ac3_Le_client_beneficie_du_seul_palier_le_plus_avantageux()
    {
        // Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
        // Un seul palier s'applique, le plus avantageux.
        var grille = ConfigurerPaliers((10, 5m), (50, 12m));
        var panier = PanierDuClient(("MUG-01", 50, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        VerifierFacture(facture, brut: 100.00m, remise: 12.00m, aPayer: 88.00m);
    }

    [Fact]
    public void Ac4_Le_client_ne_cumule_pas_les_quantites_de_references_differentes()
    {
        // La remise se calcule par ligne, jamais sur le panier entier :
        // deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
        var grille = ConfigurerPaliers((10, 5m));
        var panier = PanierDuClient(("MUG-01", 6, 2.00m), ("STY-07", 6, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        VerifierFacture(facture, brut: 24.00m, remise: 0.00m, aPayer: 24.00m);
    }

    [Fact]
    public void Ac5_Le_client_ne_recoit_pas_de_remise_avec_une_grille_vide()
    {
        // Aucun palier configuré : remise 0,00 €. Ligne de 10 articles à 2,00 €.
        var grille = ConfigurerPaliers();
        var panier = PanierDuClient(("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier, grille);

        VerifierFacture(facture, brut: 20.00m, remise: 0.00m, aPayer: 20.00m);
    }

    [Fact]
    public void Ac5_Le_client_conserve_le_chiffrage_sans_configuration_de_paliers()
    {
        // Aucun palier configuré : remise 0,00 €. Ligne de 10 articles à 2,00 €.
        var panier = PanierDuClient(("MUG-01", 10, 2.00m));

        var facture = new CalculDuPanier().Chiffrer(panier);

        VerifierFacture(facture, brut: 20.00m, remise: 0.00m, aPayer: 20.00m);
    }

    private static Panier PanierDuClient(params (string Reference, int Quantite, decimal Prix)[] lignes)
    {
        var panier = new Panier();
        foreach (var ligne in lignes)
        {
            panier.Ajoute(new LigneDePanier(ligne.Reference, Quantite.De(ligne.Quantite), Montant.De(ligne.Prix)));
        }

        return panier;
    }

    private static GrilleDePaliers ConfigurerPaliers(params (int Seuil, decimal Taux)[] paliers) =>
        new(paliers.Select(palier =>
            new PalierDeQuantite(Quantite.De(palier.Seuil), new TauxDeRemise(palier.Taux))).ToArray());

    private static void VerifierFacture(Facture facture, decimal brut, decimal remise, decimal aPayer)
    {
        Assert.Equal(Montant.De(remise), facture.Remise);
        Assert.Equal(Montant.De(brut), facture.SommeDesArticles);
        Assert.Equal(Montant.De(aPayer), facture.ATPayer);
        Assert.Equal(Montant.Zero, facture.FraisDePort);
    }
}
