namespace Tarification.Domaine;

/// <summary>Les paliers de remise, les mêmes pour toutes les références.</summary>
public sealed record BaremeDeRemises(IReadOnlyList<PalierDeRemise> Paliers)
{
    public static BaremeDeRemises Aucun { get; } = new([]);

    public static BaremeDeRemises De(IEnumerable<PalierDeRemise> paliers) => new(paliers.ToList());

    /// <summary>Le taux du palier le plus avantageux atteint par la quantité ; zéro si aucun n'est atteint.</summary>
    public Pourcentage TauxPour(Quantite quantite) =>
        Paliers
            .Where(p => p.Seuil.Valeur <= quantite.Valeur)
            .Select(p => p.Taux)
            .DefaultIfEmpty(Pourcentage.De(0m))
            .MaxBy(t => t.Valeur);
}
