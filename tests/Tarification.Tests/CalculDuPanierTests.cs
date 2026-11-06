using System.Globalization;
using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// Validation des valeurs du domaine, en complément des scénarios BDD de l'US-1.
/// </summary>
public class CalculDuPanierTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-2)]
    public void Une_quantite_nulle_ou_negative_n_existe_pas(int valeur)
    {
        var erreur = Assert.Throws<ArgumentOutOfRangeException>(() => Quantite.De(valeur));

        Assert.Equal("valeur", erreur.ParamName);
        Assert.Equal(valeur, erreur.ActualValue);
        Assert.Contains("Une quantité vaut au moins 1.", erreur.Message);
    }

    [Fact]
    public void Un_montant_negatif_n_existe_pas()
    {
        var erreur = Assert.Throws<ArgumentOutOfRangeException>(() => Montant.De(-0.01m));

        Assert.Equal("euros", erreur.ParamName);
        Assert.Equal(-0.01m, erreur.ActualValue);
        Assert.Contains("Un montant ne peut pas être négatif.", erreur.Message);
    }

    [Fact]
    public void Le_client_peut_chiffrer_un_seul_article()
    {
        var panier = new Panier().Ajoute(new LigneDePanier("MUG-01", Quantite.De(1), Montant.De(4.50m)));

        var facture = new CalculDuPanier().Chiffrer(panier);

        Assert.Equal(Montant.De(4.50m), facture.SommeDesArticles);
    }

    [Fact]
    public void Un_montant_multiplie_par_zero_vaut_zero()
    {
        var resultat = Montant.De(12.50m).Multiplie(0);

        Assert.Equal(Montant.Zero, resultat);
    }

    [Fact]
    public void Un_facteur_negatif_est_refuse()
    {
        var erreur = Assert.Throws<ArgumentOutOfRangeException>(() => Montant.De(12.50m).Multiplie(-1));

        Assert.Equal("facteur", erreur.ParamName);
        Assert.Equal(-1, erreur.ActualValue);
        Assert.Contains("Un facteur négatif n'a pas de sens ici.", erreur.Message);
    }

    [Fact]
    public void Un_montant_s_affiche_en_euros_avec_deux_decimales()
    {
        var cultureInitiale = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("fr-FR");

            Assert.Equal("12,50 €", Montant.De(12.50m).ToString());
        }
        finally
        {
            CultureInfo.CurrentCulture = cultureInitiale;
        }
    }
}
