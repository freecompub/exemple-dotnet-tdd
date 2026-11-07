namespace Tarification.Domaine;

/// <summary>Les paliers de remise, communs à toutes les références. Peut être vide.</summary>
public sealed class GrilleDePaliers
{
    private readonly PalierDeQuantite[] _paliers;

    private GrilleDePaliers(PalierDeQuantite[] paliers) => _paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(params PalierDeQuantite[] paliers) => new(paliers);
}
