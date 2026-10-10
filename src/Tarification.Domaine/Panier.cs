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

    public Montant SommeDesLignes() => _lignes.Aggregate(Montant.Zero, (total, l) => total + l.SousTotal);

    public Montant SommeDesRemises(BaremeDeRemise bareme) =>
        _lignes.Aggregate(Montant.Zero, (total, ligne) => total + ligne.Remise(bareme));
}
