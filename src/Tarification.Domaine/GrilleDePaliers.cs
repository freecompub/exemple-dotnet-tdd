namespace Tarification.Domaine;

/// <summary>La grille des paliers de remise par quantité, globale pour toutes les références.</summary>
public sealed class GrilleDePaliers
{
    private readonly IReadOnlyCollection<Palier> _paliers;

    private GrilleDePaliers(IReadOnlyCollection<Palier> paliers) => _paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(IEnumerable<Palier> paliers) => new([.. paliers]);

    public Palier? PalierApplicable(Quantite quantite) =>
        _paliers.Where(p => p.Seuil.Valeur <= quantite.Valeur)
            .Cast<Palier?>()
            .MaxBy(p => p!.Value.Taux.Valeur);
}
