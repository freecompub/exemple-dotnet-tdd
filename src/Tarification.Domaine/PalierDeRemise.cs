namespace Tarification.Domaine;

/// <summary>Un taux de remise accessible à partir d'un seuil strictement positif.</summary>
public sealed record PalierDeRemise
{
    public int Seuil { get; }
    public TauxDeRemise Taux { get; }

    public PalierDeRemise(int seuil, TauxDeRemise taux)
    {
        if (seuil <= 0)
            throw new ArgumentOutOfRangeException(nameof(seuil), seuil, "Un seuil vaut au moins 1.");

        Seuil = seuil;
        Taux = taux;
    }
}
