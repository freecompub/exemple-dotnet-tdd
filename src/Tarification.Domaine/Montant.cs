namespace Tarification.Domaine;

/// <summary>
/// Une somme d'argent, en euros. Type-valeur : deux montants égaux sont interchangeables, et un
/// montant négatif n'existe pas dans ce domaine — un remboursement serait un autre concept.
/// </summary>
public readonly record struct Montant : IComparable<Montant>
{
    public decimal Euros { get; }

    private Montant(decimal euros) => Euros = euros;

    public static Montant De(decimal euros) =>
        euros < 0 ? throw new ArgumentOutOfRangeException(nameof(euros), euros, "Un montant ne peut pas être négatif.") : new Montant(euros);

    public static Montant Zero { get; } = new(0m);

    public static Montant operator +(Montant a, Montant b) => new(a.Euros + b.Euros);

    public static Montant operator -(Montant a, Montant b) => De(a.Euros - b.Euros);

    public Montant Applique(TauxDeRemise taux) => De(Euros * taux.Pourcentage / 100m);

    public Montant Multiplie(int facteur) =>
        facteur < 0 ? throw new ArgumentOutOfRangeException(nameof(facteur), facteur, "Un facteur négatif n'a pas de sens ici.") : new Montant(Euros * facteur);

    public int CompareTo(Montant autre) => Euros.CompareTo(autre.Euros);

    public override string ToString() => $"{Euros:0.00} €";
}
