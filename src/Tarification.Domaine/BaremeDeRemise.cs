namespace Tarification.Domaine;

public readonly record struct BaremeDeRemise
{
    private readonly PalierDeRemise[]? _paliers;

    private BaremeDeRemise(PalierDeRemise[] paliers) => _paliers = paliers;

    public static BaremeDeRemise De(params PalierDeRemise[] paliers) =>
        new(paliers.Select(palier => PalierDeRemise.De(palier.Seuil, palier.Taux)).ToArray());

    public Montant RemisePour(LigneDePanier ligne)
    {
        foreach (var palier in _paliers ?? [])
        {
            if (ligne.Quantite.Valeur >= palier.Seuil.Valeur)
                return ligne.SousTotal.Applique(palier.Taux);
        }

        return Montant.Zero;
    }
}
