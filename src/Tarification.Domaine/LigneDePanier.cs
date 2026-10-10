namespace Tarification.Domaine;

/// <summary>Un article et sa quantité, au prix unitaire du moment.</summary>
public sealed record LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)
{
    public Montant SousTotal => PrixUnitaire.Multiplie(Quantite.Valeur);

    public Montant Remise(BaremeDeRemise bareme) => SousTotal.Applique(bareme.TauxPour(Quantite));
}
