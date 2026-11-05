namespace Tarification.Domaine;

/// <summary>
/// L'ensemble des paliers de remise par quantité, communs à toutes les références du panier. Une
/// grille vide (<see cref="Vide"/>) ne déclenche jamais de remise.
/// </summary>
public sealed class GrilleDeRemise
{
    private readonly IReadOnlyList<PalierDeRemise> _paliers;

    private GrilleDeRemise(IReadOnlyList<PalierDeRemise> paliers) => _paliers = paliers;

    public static GrilleDeRemise Vide { get; } = new([]);

    public static GrilleDeRemise De(IEnumerable<PalierDeRemise> paliers) => new([.. paliers]);

    // Stub de compilation (DISTILL) : la sélection du palier le plus avantageux (taux le plus
    // élevé parmi les seuils atteints) est la logique métier à construire dans la boucle interne
    // — voir .skraft/us-2/distill/impl-plan.md.
    public PalierDeRemise? PalierLePlusAvantageux(Quantite quantite) => null;
}
