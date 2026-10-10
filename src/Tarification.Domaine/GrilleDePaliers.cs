namespace Tarification.Domaine;

public sealed record GrilleDePaliers(IReadOnlyList<PalierDeQuantite> Paliers)
{
    public Montant RemiseDe(LigneDePanier ligne) => Paliers
        .Where(palier => palier.Seuil.Valeur <= ligne.Quantite.Valeur)
        .Select(palier => ligne.SousTotal.Multiplie(palier.Taux))
        .Aggregate(Montant.Zero, (remise, remiseDuPalier) =>
            remiseDuPalier.CompareTo(remise) > 0 ? remiseDuPalier : remise);
}
