using System;
using System.Collections.Generic;
using System.Linq;

namespace Tarification.Domaine;

/// <summary>
/// La grille des paliers de remise par quantité, globale pour toutes les références.
/// </summary>
public sealed class GrilleDePaliers
{
    private readonly IReadOnlyCollection<Palier> _paliers;

    private GrilleDePaliers(IReadOnlyCollection<Palier> paliers) => _paliers = paliers;

    public static GrilleDePaliers Vide { get; } = new(Array.Empty<Palier>());

    public static GrilleDePaliers De(IEnumerable<Palier> paliers) => new(paliers.ToArray());

    public Palier? PalierApplicable(Quantite quantite) =>
        _paliers
            .Where(palier => quantite.Valeur >= palier.Seuil.Valeur)
            .OrderByDescending(palier => palier.Taux.Valeur)
            .Select(palier => (Palier?)palier)
            .FirstOrDefault();
}
