namespace Tarification.Domaine;

/// <summary>Un article et sa quantité, au prix unitaire du moment.</summary>
public sealed record LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)
{
    public Montant SousTotal => PrixUnitaire.Multiplie(Quantite.Valeur);

    public Montant Remise(PaliersDeQuantite paliers)
    {
        var palier = paliers.PalierLePlusAvantageuxPour(Quantite);
        return palier is null
            ? Montant.Zero
            : Montant.De(SousTotal.Euros * palier.Pourcentage / 100m);
    }
}
