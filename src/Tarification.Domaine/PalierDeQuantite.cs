namespace Tarification.Domaine;

/// <summary>Un seuil de quantité et le taux de remise qu'il déclenche.</summary>
public readonly record struct PalierDeQuantite
{
    public Quantite Seuil { get; }

    public Pourcentage Taux { get; }

    private PalierDeQuantite(Quantite seuil, Pourcentage taux)
    {
        Seuil = seuil;
        Taux = taux;
    }

    public static PalierDeQuantite De(Quantite seuil, Pourcentage taux) => new(seuil, taux);
}
