namespace Tarification.Domaine;

// Signature provisoire ; ni validation, ni immutabilité, ni sélection de remise encore réalisées.
public sealed record GrilleDePaliers(IReadOnlyList<PalierDeQuantite> Paliers);
