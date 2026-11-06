using Tarification.Domaine;
using Xunit;

namespace Tarification.UnitTests.Features.RemiseParPalier;

public sealed class TauxDeRemiseTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void Un_taux_hors_de_0_a_100_est_refuse(decimal pourcentage)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => TauxDeRemise.De(pourcentage));
    }
}
