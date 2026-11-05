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
    // Surcharge conservée pour ne pas casser la compilation de
    // tests/Tarification.Tests/CalculDuPanierTests.cs (hors périmètre d'écriture de DISTILL) ;
    // sa suppression, prévue par .skraft/us-2/design/contracts.md, revient à la boucle interne.
    public Facture Chiffrer(Panier panier) => Chiffrer(panier, GrilleDeRemise.Vide);

    public Facture Chiffrer(Panier panier, GrilleDeRemise grille) =>
        new(panier.SommeDesLignes(), panier.Lignes.Aggregate(Montant.Zero, (total, ligne) => total + ligne.Remise(grille)), Montant.Zero);
}
