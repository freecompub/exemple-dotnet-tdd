namespace Dosage.Domaine;

/// <summary>
/// Une quantité d'insuline, en unités (U). Type-valeur : deux quantités égales sont
/// interchangeables, et une quantité négative n'existe pas.
/// </summary>
public readonly record struct Unite
{
    public decimal Valeur { get; }

    public Unite(decimal valeur)
    {
        if (valeur < 0) throw new ArgumentOutOfRangeException(nameof(valeur), valeur, "Une dose ne peut pas être négative.");
        Valeur = valeur;
    }

    public static Unite De(decimal valeur) => new(valeur);

    public bool Depasse(Unite autre) => Valeur > autre.Valeur;

    public override string ToString() => $"{Valeur:0.##} U";
}
