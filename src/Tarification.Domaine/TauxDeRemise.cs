namespace Tarification.Domaine;

/// <summary>Un pourcentage de remise, entre 0 et 100 inclus.</summary>
public readonly record struct TauxDeRemise
{
    public decimal Pourcentage { get; }

    public static TauxDeRemise De(decimal pourcentage) => default;
}
