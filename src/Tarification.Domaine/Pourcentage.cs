namespace Tarification.Domaine;

/// <summary>Un taux en pourcents (5 pour « 5 % »), servant à exprimer une remise.</summary>
public readonly record struct Pourcentage
{
    public decimal Valeur { get; }

    private Pourcentage(decimal valeur) => Valeur = valeur;

    public static Pourcentage De(decimal valeur) => new(valeur);
}
