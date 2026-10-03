using Tarification.Domaine;

namespace Tarification.Application;

/// <summary>
/// Ce qu'un client doit payer, et le détail qui l'explique. Les frais de port restent à zéro tant
/// que la story correspondante n'est pas livrée : mieux vaut un champ visiblement vide qu'un champ
/// absent qu'on oublierait de remplir. La remise, elle, est calculée par palier de quantité
/// (US-2) et vient en déduction de la somme des articles.
/// </summary>
public sealed record Facture(Montant SommeDesArticles, Montant Remise, Montant FraisDePort)
{
    public Montant ATPayer => SommeDesArticles.Soustrait(Remise) + FraisDePort;
}

/// <summary>
/// Cas d'usage : chiffrer un panier. Point d'entrée de la couche application, c'est lui que les
/// tests d'acceptance pilotent.
/// </summary>
public sealed class CalculDuPanier
{
    // Surcharge conservée telle quelle pour ne pas casser tests/Tarification.Tests/CalculDuPanierTests.cs
    // (US-1, hors périmètre d'écriture de cette phase) — voir .skraft/us-2/distill/impl-plan.md.
    public Facture Chiffrer(Panier panier) => Chiffrer(panier, GrilleDePaliers.Vide);

    public Facture Chiffrer(Panier panier, GrilleDePaliers grille) =>
        new(panier.SommeDesLignes(), panier.SommeDesRemises(grille), Montant.Zero);
}
