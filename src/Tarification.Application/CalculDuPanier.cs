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
    private readonly GrilleDePaliers _grille;

    public CalculDuPanier() : this(GrilleDePaliers.Vide)
    {
    }

    public CalculDuPanier(GrilleDePaliers grille) => _grille = grille;

    public Facture Chiffrer(Panier panier) => new(panier.SommeDesLignes(), RemiseDe(panier), Montant.Zero);

    private Montant RemiseDe(Panier panier) =>
        panier.Lignes.Aggregate(Montant.Zero, (total, ligne) => total + _grille.RemiseDe(ligne));
}
