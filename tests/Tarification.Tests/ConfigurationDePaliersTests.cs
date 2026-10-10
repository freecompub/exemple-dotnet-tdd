using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

// M4: branch_unreachable_via_AC — les acceptances ne construisent que des configurations valides.
public class ConfigurationDePaliersTests
{
    [Fact]
    public void Un_palier_rejette_une_quantite_par_defaut()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new PalierDeQuantite(default(Quantite), new TauxDeRemise(5m)));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(101)]
    public void Un_taux_hors_intervalle_est_rejete_a_la_construction(int pourcentage)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new TauxDeRemise(pourcentage));
    }

    [Fact]
    public void Un_taux_de_cent_pour_cent_est_accepte()
    {
        var taux = new TauxDeRemise(100m);

        Assert.Equal(100m, taux.Valeur);
    }

    [Fact]
    public void Un_palier_rejette_un_taux_par_defaut()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new PalierDeQuantite(Quantite.De(10), default(TauxDeRemise)));
    }

    [Fact]
    public void Une_grille_rejette_deux_paliers_de_meme_seuil()
    {
        var paliers = new[]
        {
            new PalierDeQuantite(Quantite.De(10), new TauxDeRemise(5m)),
            new PalierDeQuantite(Quantite.De(10), new TauxDeRemise(12m))
        };

        Assert.ThrowsAny<ArgumentException>(() => new GrilleDePaliers(paliers));
    }
}
