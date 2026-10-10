namespace Tarification.Domaine;

public sealed record GrilleDePaliers
{
    public IReadOnlyList<PalierDeQuantite> Paliers { get; }

    public GrilleDePaliers(IReadOnlyList<PalierDeQuantite> paliers)
    {
        ArgumentNullException.ThrowIfNull(paliers);
        var copie = paliers.ToArray();
        var seuils = new HashSet<int>();
        foreach (var palier in copie)
        {
            ArgumentNullException.ThrowIfNull(palier);
            if (!seuils.Add(palier.Seuil.Valeur))
            {
                throw new ArgumentException("Les seuils des paliers doivent être distincts.", nameof(paliers));
            }
        }

        Paliers = Array.AsReadOnly(copie);
    }

    public Montant RemiseDe(LigneDePanier ligne) => Paliers
        .Where(palier => palier.Seuil.Valeur <= ligne.Quantite.Valeur)
        .Select(palier => ligne.SousTotal.Multiplie(palier.Taux))
        .Aggregate(Montant.Zero, (remise, remiseDuPalier) =>
            remiseDuPalier.CompareTo(remise) > 0 ? remiseDuPalier : remise);
}
