namespace Tarification.Domaine;

public sealed record PalierDeQuantite
{
    public Quantite Seuil { get; }
    public TauxDeRemise Taux { get; }

    public PalierDeQuantite(Quantite seuil, TauxDeRemise taux)
    {
        Seuil = Quantite.De(seuil.Valeur);
        Taux = new TauxDeRemise(taux.Valeur);
    }
}
