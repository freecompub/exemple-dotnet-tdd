namespace Tarification.Domaine;

/// <summary>Les paliers de remise par quantité, les mêmes pour toutes les références.</summary>
public sealed class GrilleDeRemise
{
    private GrilleDeRemise(PalierDeQuantite[] paliers) => Paliers = paliers;

    public IReadOnlyList<PalierDeQuantite> Paliers { get; }

    public static GrilleDeRemise Vide { get; } = new([]);

    public static GrilleDeRemise De(params PalierDeQuantite[] paliers) => new(paliers);

    public Montant RemisePour(Panier panier) =>
        panier.Lignes.Aggregate(Montant.Zero, (total, ligne) => total + RemisePour(ligne));

    private Montant RemisePour(LigneDePanier ligne) =>
        ligne.SousTotal.Fraction(MeilleurTauPour(ligne.Quantite));

    private decimal MeilleurTauPour(Quantite quantite) =>
        Paliers
            .Where(palier => palier.Seuil.Valeur <= quantite.Valeur)
            .Select(palier => palier.Taux.Valeur)
            .DefaultIfEmpty(0m)
            .Max();
}
