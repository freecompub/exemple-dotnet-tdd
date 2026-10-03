namespace Tarification.Domaine;

/// <summary>
/// La grille des paliers de remise par quantité, globale pour toutes les références.
/// <see cref="PalierApplicable"/> retient, parmi les seuils atteints, le plus avantageux.
/// </summary>
public sealed class GrilleDePaliers
{
    public static GrilleDePaliers Vide { get; } = new([]);

    private readonly IReadOnlyList<Palier> _paliers;

    private GrilleDePaliers(IReadOnlyList<Palier> paliers) => _paliers = paliers;

    public static GrilleDePaliers De(IEnumerable<Palier> paliers) => new(paliers.ToList());

    public Palier? PalierApplicable(Quantite quantite) =>
        _paliers
            .Where(palier => quantite.Valeur >= palier.Seuil.Valeur)
            .OrderByDescending(palier => palier.Taux.Valeur)
            .Select(palier => (Palier?)palier)
            .FirstOrDefault();
}
