namespace Tarification.Domaine;

/// <summary>Les paliers communs aux références et leur taux le plus avantageux pour une quantité.</summary>
public sealed record BaremeDeRemise
{
    public IReadOnlyList<PalierDeRemise> Paliers { get; }

    public BaremeDeRemise(IReadOnlyList<PalierDeRemise> paliers)
    {
        var copieDesPaliers = paliers.ToArray();
        if (copieDesPaliers.Select(palier => palier.Seuil).Distinct().Count() != copieDesPaliers.Length)
            throw new ArgumentException("Les seuils des paliers doivent être distincts.", nameof(paliers));

        Paliers = Array.AsReadOnly(copieDesPaliers);
    }

    public TauxDeRemise TauxPour(Quantite quantite) =>
        new(Paliers.Where(palier => palier.Seuil <= quantite.Valeur)
            .Select(palier => palier.Taux.Pourcentage)
            .DefaultIfEmpty(0m)
            .Max());
}
