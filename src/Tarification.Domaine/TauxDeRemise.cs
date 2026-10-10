namespace Tarification.Domaine;

/// <summary>Un pourcentage de remise compris entre 0 et 100 inclus.</summary>
public sealed record TauxDeRemise
{
    public decimal Pourcentage { get; }

    public TauxDeRemise(decimal pourcentage)
    {
        if (pourcentage < 0m || pourcentage > 100m)
            throw new ArgumentOutOfRangeException(nameof(pourcentage), pourcentage, "Un taux de remise est compris entre 0 et 100 %.");

        Pourcentage = pourcentage;
    }
}
