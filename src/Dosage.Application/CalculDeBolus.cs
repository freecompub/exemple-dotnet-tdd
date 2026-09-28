using Dosage.Domaine;

namespace Dosage.Application;

/// <summary>Résultat d'un calcul : la dose retenue, et l'alerte qui l'explique s'il y en a une.</summary>
public sealed record Proposition(Unite Dose, string? Alerte);

/// <summary>
/// Cas d'usage : proposer une dose, plafond compris. Point d'entrée de la couche application,
/// c'est lui que les tests d'acceptance pilotent.
/// </summary>
public sealed class CalculDeBolus
{
    public Proposition Proposer(Unite calculee, Plafond plafond)
    {
        var retenue = plafond.Appliquer(calculee);
        // Pas d'alerte quand rien n'a été rogné : une alerte qui ne surprend pas finit ignorée.
        return retenue == calculee ? new Proposition(retenue, null) : new Proposition(retenue, $"Dose plafonnée à {retenue}");
    }
}
