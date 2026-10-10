namespace Tarification.Domaine;

// Signature de DISTILL ; les invariants de construction restent à implémenter.
public sealed record BaremeDeRemise(IReadOnlyList<PalierDeRemise> Paliers);
