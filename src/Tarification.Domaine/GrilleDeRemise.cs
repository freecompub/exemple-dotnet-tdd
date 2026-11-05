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

    public PalierDeRemise? PalierLePlusAvantageux(Quantite quantite)
    {
        PalierDeRemise? meilleur = null;
        foreach (var palier in _paliers)
        {
            if (quantite.Valeur < palier.SeuilMinimal.Valeur) continue;
            if (meilleur is null || palier.Taux > meilleur.Value.Taux) meilleur = palier;
        }

        return meilleur;
    }
}
