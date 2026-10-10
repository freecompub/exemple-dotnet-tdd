namespace Tarification.Domaine;

public sealed record PaliersDeQuantite(params PalierDeQuantite[] Paliers)
{
    public PalierDeQuantite? PalierLePlusAvantageuxPour(Quantite quantite) =>
        Paliers
            .Where(palier => quantite.Valeur >= palier.Seuil)
            .OrderByDescending(palier => palier.Pourcentage)
            .FirstOrDefault();
}
