using Tarification.Domaine;

namespace Tarification.Application;

/// <summary>
/// Ce qu'un client doit payer, et le détail qui l'explique. Les remises et les frais de port
/// restent à zéro tant que les stories correspondantes ne sont pas livrées : mieux vaut un champ
/// visiblement vide qu'un champ absent qu'on oublierait de remplir.
/// </summary>
public sealed record Facture(Montant SommeDesArticles, Montant Remise, Montant FraisDePort)
{
    public Montant ATPayer => SommeDesArticles + FraisDePort;
}

/// <summary>
/// Cas d'usage : chiffrer un panier. Point d'entrée de la couche application, c'est lui que les
/// tests d'acceptance pilotent.
/// </summary>
public sealed class CalculDuPanier
{
    public Facture Chiffrer(Panier panier) => new(panier.SommeDesLignes(), Montant.Zero, Montant.Zero);

    // Bouchon DISTILL : conserve le comportement sans remise pour obtenir un rouge métier.
    public Facture Chiffrer(Panier panier, GrilleDePaliers grille) => Chiffrer(panier);
}
