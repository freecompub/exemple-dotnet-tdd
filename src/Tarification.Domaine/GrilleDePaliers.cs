namespace Tarification.Domaine;

/// <summary>Les paliers de remise, identiques pour toutes les références.</summary>
public sealed class GrilleDePaliers
{
    public IReadOnlyList<PalierDeQuantite> Paliers { get; }

    private GrilleDePaliers(IReadOnlyList<PalierDeQuantite> paliers) => Paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(params PalierDeQuantite[] paliers) => new(paliers);

    /// <summary>Le taux le plus avantageux parmi les paliers atteints ; zéro si aucun ne l'est.</summary>
    public TauxDeRemise TauxPour(Quantite quantite) =>
        TauxDeRemise.De(
            Paliers
                .Where(palier => palier.Seuil.Valeur <= quantite.Valeur)
                .Select(palier => palier.Taux.Pourcentage)
                .DefaultIfEmpty(0m)
                .Max());
}
