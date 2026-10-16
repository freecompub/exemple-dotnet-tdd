namespace Tarification.Domaine;

public readonly record struct TauxDeRemise
{
    public decimal Pourcentage { get; }

    private TauxDeRemise(decimal pourcentage) => Pourcentage = pourcentage;

    public static TauxDeRemise De(decimal pourcentage) =>
        pourcentage < 0m || pourcentage > 100m
            ? throw new ArgumentOutOfRangeException(nameof(pourcentage), pourcentage, "Un taux de remise est compris entre 0 et 100 %.")
            : new TauxDeRemise(pourcentage);
}
