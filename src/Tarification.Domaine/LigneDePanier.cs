namespace Tarification.Domaine;

/// <summary>Un article et sa quantité, au prix unitaire du moment.</summary>
public sealed record LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)
{
    public Montant SousTotal => PrixUnitaire.Multiplie(Quantite.Valeur);

    public Montant Remise(GrilleDePaliers grille) =>
        grille.PalierApplicable(Quantite) is { } palier ? SousTotal.Multiplie(palier.Taux) : Montant.Zero;
}
