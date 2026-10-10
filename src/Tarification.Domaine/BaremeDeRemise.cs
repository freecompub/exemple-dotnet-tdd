namespace Tarification.Domaine;

/// <summary>Les paliers communs aux références et leur taux le plus avantageux pour une quantité.</summary>
public sealed record BaremeDeRemise(IReadOnlyList<PalierDeRemise> Paliers)
{
    public TauxDeRemise TauxPour(Quantite quantite) =>
        new(Paliers.Where(palier => palier.Seuil <= quantite.Valeur)
            .Select(palier => palier.Taux.Pourcentage)
            .DefaultIfEmpty(0m)
            .Max());
}
