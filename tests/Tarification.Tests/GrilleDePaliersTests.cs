using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// Pas interne d'outside-in TDD pour @ac-2 : une grille avec un seul palier doit retenir ce
/// palier dès que la quantité atteint son seuil — le bouchon DISTILL retournait toujours null.
/// </summary>
public class GrilleDePaliersTests
{
    [Fact]
    public void Le_palier_dont_le_seuil_est_atteint_s_applique()
    {
        var palier = new Palier(Quantite.De(10), Taux.De(0.05m));
        var grille = GrilleDePaliers.De([palier]);

        Assert.Equal(palier, grille.PalierApplicable(Quantite.De(10)));
    }
}
