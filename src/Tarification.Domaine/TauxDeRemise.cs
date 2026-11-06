namespace Tarification.Domaine;

/// <summary>Un pourcentage de remise, entre 0 et 100 inclus.</summary>
public readonly record struct TauxDeRemise
{
    public decimal Pourcentage { get; }

    private TauxDeRemise(decimal pourcentage) => Pourcentage = pourcentage;

    public static TauxDeRemise De(decimal pourcentage) => new(pourcentage);

    public Montant AppliqueA(Montant montant) => montant.Part(Pourcentage);
}
