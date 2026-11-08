namespace Tarification.Domaine;

/// <summary>Les paliers de remise, les mêmes pour toutes les références.</summary>
public sealed record BaremeDeRemises(IReadOnlyList<PalierDeRemise> Paliers)
{
    public static BaremeDeRemises Aucun { get; } = new([]);

    public static BaremeDeRemises De(IEnumerable<PalierDeRemise> paliers) => new(paliers.ToList());
}
