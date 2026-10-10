namespace Tarification.Domaine;

public readonly record struct TauxDeRemise
{
    public decimal Valeur { get; }

    public TauxDeRemise(decimal valeur)
    {
        if (valeur <= 0m || valeur > 100m)
        {
            throw new ArgumentOutOfRangeException(nameof(valeur), valeur, "Un taux de remise doit être supérieur à 0 et inférieur ou égal à 100 %.");
        }

        Valeur = valeur;
    }
}
