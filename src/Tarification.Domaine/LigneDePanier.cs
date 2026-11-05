namespace Tarification.Domaine;

/// <summary>Un article et sa quantité, au prix unitaire du moment.</summary>
public sealed record LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)
{
    public Montant SousTotal => PrixUnitaire.Multiplie(Quantite.Valeur);

    // Stub de compilation (DISTILL) : le choix du palier le plus avantageux via
    // GrilleDeRemise.PalierLePlusAvantageux reste à brancher dans la boucle interne — voir
    // .skraft/us-2/distill/impl-plan.md.
    public Montant Remise(GrilleDeRemise grille) => Montant.Zero;
}
