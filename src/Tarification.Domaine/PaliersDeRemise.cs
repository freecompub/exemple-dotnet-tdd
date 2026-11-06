namespace Tarification.Domaine;

/// <summary>Les paliers communs à toutes les références ; vide quand aucun n'est configuré.</summary>
public sealed record PaliersDeRemise
{
    private readonly PalierDeRemise[] _paliers;

    private PaliersDeRemise(PalierDeRemise[] paliers) => _paliers = (PalierDeRemise[])paliers.Clone();

    public static PaliersDeRemise De(params PalierDeRemise[] paliers) => new(paliers);

    public TauxDeRemise TauxPour(Quantite quantite)
    {
        var palier = _paliers.FirstOrDefault();
        return palier.Taux;
    }

    public bool Equals(PaliersDeRemise? autre) =>
        autre is not null && _paliers.SequenceEqual(autre._paliers);

    public override int GetHashCode() =>
        _paliers.Aggregate(0, (empreinte, palier) => HashCode.Combine(empreinte, palier));
}
