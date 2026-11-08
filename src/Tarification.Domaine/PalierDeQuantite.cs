namespace Tarification.Domaine;

/// <summary>« N articles ou plus : X % ».</summary>
public readonly record struct PalierDeQuantite
{
    public Quantite Seuil { get; }

    public TauxDeRemise Taux { get; }

    private PalierDeQuantite(Quantite seuil, TauxDeRemise taux)
    {
        Seuil = seuil;
        Taux = taux;
    }

    public static PalierDeQuantite De(Quantite seuil, TauxDeRemise taux) => new(seuil, taux);
}
