namespace Tarification.Domaine;

/// <summary>Un taux, exprimé en pour-cent : 5 % s'écrit <c>Pourcentage.De(5m)</c>.</summary>
public readonly record struct Pourcentage
{
    public decimal Valeur { get; }

    private Pourcentage(decimal valeur) => Valeur = valeur;

    public static Pourcentage De(decimal valeur) => new(valeur);
}
