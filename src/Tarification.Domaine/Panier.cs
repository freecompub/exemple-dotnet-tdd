namespace Tarification.Domaine;

/// <summary>Les lignes retenues par un client. Un panier peut être vide : son total vaut zéro.</summary>
public sealed class Panier
{
    private readonly List<LigneDePanier> _lignes = [];

    public IReadOnlyList<LigneDePanier> Lignes => _lignes;

    public Panier Ajoute(LigneDePanier ligne)
    {
        _lignes.Add(ligne);
        return this;
    }

    public Montant SommeDesLignes()
    {
        var totalInitial = Montant.Zero;
        return _lignes.Aggregate(totalInitial, AdditionneSousTotal);
    }

    private static Montant AdditionneSousTotal(Montant total, LigneDePanier ligne) =>
        total + ligne.SousTotal;

    public ChiffrageDuPanier Chiffrer(PaliersDeRemise paliers) =>
        new(new BilanArticles(SommeDesLignes(), SommeDesRemises(paliers)), Montant.Zero);

    private Montant SommeDesRemises(PaliersDeRemise paliers)
    {
        var remiseInitiale = Montant.Zero;
        return _lignes.Aggregate(remiseInitiale, (remise, ligne) => AdditionneRemise(remise, ligne, paliers));
    }

    private static Montant AdditionneRemise(Montant remise, LigneDePanier ligne, PaliersDeRemise paliers) =>
        remise + ligne.Remise(paliers);
}
