namespace Tarification.Domaine;

public sealed record PaliersDeQuantite(params PalierDeQuantite[] Paliers)
{
    public Montant RemisePour(LigneDePanier ligne)
    {
        var palier = Paliers.FirstOrDefault(palier => ligne.Quantite.Valeur >= palier.Seuil);
        return palier is null
            ? Montant.Zero
            : Montant.De(ligne.SousTotal.Euros * palier.Pourcentage / 100m);
    }
}
