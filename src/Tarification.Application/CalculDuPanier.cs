using Tarification.Domaine;

namespace Tarification.Application;

/// <summary>
/// Ce qu'un client doit payer, et le détail qui l'explique.
/// Les frais de port restent à zéro tant que leur story n'est pas livrée.
/// </summary>
public sealed record Facture(Montant SommeDesArticles, Montant Remise, Montant FraisDePort)
{
    public Montant ATPayer => SommeDesArticles - Remise + FraisDePort;
}

/// <summary>
/// Cas d'usage : chiffrer un panier. Point d'entrée de la couche application, c'est lui que les
/// tests d'acceptance pilotent.
/// </summary>
public sealed class CalculDuPanier
{
    public Facture Chiffrer(Panier panier) => Chiffrer(panier, new BaremeDeRemise([]));

    public Facture Chiffrer(Panier panier, BaremeDeRemise bareme) =>
        new(panier.SommeDesLignes(), panier.SommeDesRemises(bareme), Montant.Zero);
}
