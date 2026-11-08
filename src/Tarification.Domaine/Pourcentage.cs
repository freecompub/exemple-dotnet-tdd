namespace Tarification.Domaine;

/// <summary>Un taux en pourcent.</summary>
public readonly record struct Pourcentage
{
    public decimal Valeur { get; }

    private Pourcentage(decimal valeur) => Valeur = valeur;

    public static Pourcentage De(decimal valeur) => new(valeur);
}
