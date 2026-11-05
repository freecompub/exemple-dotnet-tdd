namespace Tarification.Domaine;

/// <summary>
/// Un seuil de quantité et le taux de remise qui s'applique dès qu'une ligne l'atteint. Type-valeur :
/// deux paliers de mêmes seuil et taux sont interchangeables.
/// </summary>
public readonly record struct PalierDeRemise
{
    public Quantite SeuilMinimal { get; }
    public decimal Taux { get; }

    private PalierDeRemise(Quantite seuilMinimal, decimal taux)
    {
        SeuilMinimal = seuilMinimal;
        Taux = taux;
    }

    public static PalierDeRemise De(Quantite seuilMinimal, decimal taux) =>
        taux <= 0m || taux > 1m
            ? throw new ArgumentOutOfRangeException(nameof(taux), taux, "Un taux de remise vaut entre 0 (exclu) et 1 (100 %, inclus).")
            : new PalierDeRemise(seuilMinimal, taux);
}
