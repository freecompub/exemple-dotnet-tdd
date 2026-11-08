namespace Tarification.Domaine;

/// <summary>Les paliers de remise, identiques pour toutes les références.</summary>
public sealed class GrilleDePaliers
{
    public IReadOnlyList<PalierDeQuantite> Paliers { get; }

    private GrilleDePaliers(IReadOnlyList<PalierDeQuantite> paliers) => Paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(params PalierDeQuantite[] paliers) => new(paliers);
}
