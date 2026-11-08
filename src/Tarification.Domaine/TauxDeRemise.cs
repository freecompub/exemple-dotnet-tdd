namespace Tarification.Domaine;

/// <summary>Un pourcentage de remise. Jamais négatif.</summary>
public readonly record struct TauxDeRemise
{
    public decimal Pourcentage { get; }

    private TauxDeRemise(decimal pourcentage) => Pourcentage = pourcentage;

    public static TauxDeRemise De(decimal pourcentage) =>
        pourcentage < 0 ? throw new ArgumentOutOfRangeException(nameof(pourcentage), pourcentage, "Un taux ne peut pas être négatif.") : new TauxDeRemise(pourcentage);
}
