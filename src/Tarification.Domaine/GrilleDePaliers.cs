namespace Tarification.Domaine;

/// <summary>La grille des paliers de remise par quantité, globale pour toutes les références.</summary>
public sealed class GrilleDePaliers
{
    private readonly IReadOnlyCollection<Palier> _paliers;

    private GrilleDePaliers(IReadOnlyCollection<Palier> paliers) => _paliers = paliers;

    /// <summary>Grille sans aucun palier configuré : aucune remise ne peut jamais s'appliquer (@ac-5).</summary>
    public static GrilleDePaliers Vide { get; } = new([]);

    public static GrilleDePaliers De(IEnumerable<Palier> paliers) => new([.. paliers]);

    /// <summary>
    /// Le palier applicable à une quantité donnée, ou <c>null</c> si aucun seuil n'est atteint
    /// (@ac-1, grille vide @ac-5). Quand plusieurs seuils sont atteints, celui au taux le plus
    /// avantageux l'emporte — un seul palier s'applique jamais (@ac-3).
    /// </summary>
    public Palier? PalierApplicable(Quantite quantite) =>
        _paliers.Where(p => p.Seuil.Valeur <= quantite.Valeur)
            .Cast<Palier?>()
            .MaxBy(p => p!.Value.Taux.Valeur);
}
