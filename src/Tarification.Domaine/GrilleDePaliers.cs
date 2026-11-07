namespace Tarification.Domaine;

/// <summary>Les paliers de remise, communs à toutes les références. Peut être vide.</summary>
public sealed class GrilleDePaliers
{
    private readonly PalierDeQuantite[] _paliers;

    private GrilleDePaliers(PalierDeQuantite[] paliers) => _paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(params PalierDeQuantite[] paliers) => new(paliers);

    /// <summary>La remise d'une ligne : le palier atteint le plus avantageux, ou aucune remise.</summary>
    public Montant RemiseDe(LigneDePanier ligne) =>
        _paliers
            .Where(p => ligne.Quantite.Valeur >= p.Seuil.Valeur)
            .Select(p => ligne.SousTotal.Pour(p.Taux))
            .DefaultIfEmpty(Montant.Zero)
            .Max();
}
