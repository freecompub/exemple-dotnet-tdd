using Tarification.Domaine;

namespace Tarification.Application;

/// <summary>
/// Ce qu'un client doit payer, et le détail du chiffrage calculé dans le domaine.
/// </summary>
public sealed record Facture(Montant SommeDesArticles, Montant Remise, Montant FraisDePort, Montant ATPayer)
{
    public Facture(Montant sommeDesArticles, Montant remise, Montant fraisDePort)
        : this(sommeDesArticles, remise, fraisDePort,
            new ChiffrageDuPanier(new BilanArticles(sommeDesArticles, remise), fraisDePort).ATPayer)
    {
    }
}

/// <summary>
/// Cas d'usage : chiffrer un panier. Point d'entrée de la couche application, c'est lui que les
/// tests d'acceptance pilotent.
/// </summary>
public sealed class CalculDuPanier
{
    public Facture Chiffrer(Panier panier) => Chiffrer(panier, PaliersDeRemise.De());

    public Facture Chiffrer(Panier panier, PaliersDeRemise paliers)
    {
        var chiffrage = panier.Chiffrer(paliers);
        var bilan = chiffrage.Bilan;
        return new Facture(bilan.Articles, bilan.Remise, chiffrage.FraisDePort, chiffrage.ATPayer);
    }
}
