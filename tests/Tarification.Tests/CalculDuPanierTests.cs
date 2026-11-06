using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// Validation des valeurs du domaine, en complément des scénarios BDD de l'US-1.
/// </summary>
public class CalculDuPanierTests
{
    [Fact]
    public void Une_quantite_nulle_ou_negative_n_existe_pas()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Quantite.De(0));
        Assert.Throws<ArgumentOutOfRangeException>(() => Quantite.De(-2));
    }

    [Fact]
    public void Un_montant_negatif_n_existe_pas()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Montant.De(-0.01m));
    }
}
