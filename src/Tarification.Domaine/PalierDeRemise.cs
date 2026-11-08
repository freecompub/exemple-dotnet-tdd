namespace Tarification.Domaine;

/// <summary>Un seuil de quantité et le taux de remise qu'il ouvre.</summary>
public sealed record PalierDeRemise(Quantite Seuil, Pourcentage Taux)
{
    public static PalierDeRemise De(Quantite seuil, Pourcentage taux) => new(seuil, taux);
}
