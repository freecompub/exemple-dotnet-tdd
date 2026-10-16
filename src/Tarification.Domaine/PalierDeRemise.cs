namespace Tarification.Domaine;

public readonly record struct PalierDeRemise
{
    public Quantite Seuil { get; }
    public TauxDeRemise Taux { get; }

    private PalierDeRemise(Quantite seuil, TauxDeRemise taux)
    {
        Seuil = seuil;
        Taux = taux;
    }

    public static PalierDeRemise De(Quantite seuil, TauxDeRemise taux) =>
        new(Quantite.De(seuil.Valeur), taux);
}
