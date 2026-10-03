namespace Tarification.Domaine;

/// <summary>
/// La grille des paliers de remise par quantité, globale pour toutes les références. Bouchon
/// DISTILL : <see cref="PalierApplicable"/> ne retient volontairement jamais de palier — la règle
/// de sélection (le taux le plus avantageux parmi les seuils atteints) revient à la boucle interne
/// (voir .skraft/us-2/distill/impl-plan.md).
/// </summary>
public sealed class GrilleDePaliers
{
    public static GrilleDePaliers Vide { get; } = new();

    public static GrilleDePaliers De(IEnumerable<Palier> paliers) => new();

    public Palier? PalierApplicable(Quantite quantite) => null;
}
