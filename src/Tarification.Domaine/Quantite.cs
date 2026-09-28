namespace Tarification.Domaine;

/// <summary>Un nombre d'articles. Au moins un : une ligne de panier vide n'a pas lieu d'être.</summary>
public readonly record struct Quantite
{
    public int Valeur { get; }

    private Quantite(int valeur) => Valeur = valeur;

    public static Quantite De(int valeur) =>
        valeur < 1 ? throw new ArgumentOutOfRangeException(nameof(valeur), valeur, "Une quantité vaut au moins 1.") : new Quantite(valeur);

    public override string ToString() => Valeur.ToString();
}
