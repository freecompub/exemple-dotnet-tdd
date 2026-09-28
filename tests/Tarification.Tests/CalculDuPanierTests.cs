using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.Tests;

/// <summary>
/// US-1, déjà livrée : elle donne une base verte aux portes. Les stories suivantes ne le sont
/// pas — c'est là que /tdd et /skraft ont du travail.
/// </summary>
public class CalculDuPanierTests
{
    private static LigneDePanier Ligne(string reference, int quantite, decimal prix) =>
        new(reference, Quantite.De(quantite), Montant.De(prix));

    [Fact] // @ac-1
    public void Une_ligne_vaut_son_prix_unitaire_fois_sa_quantite()
    {
        var facture = new CalculDuPanier().Chiffrer(new Panier().Ajoute(Ligne("MUG-01", 3, 4.50m)));

        Assert.Equal(Montant.De(13.50m), facture.SommeDesArticles);
    }

    [Fact] // @ac-2
    public void Plusieurs_lignes_s_additionnent()
    {
        var panier = new Panier().Ajoute(Ligne("MUG-01", 3, 4.50m)).Ajoute(Ligne("STY-07", 2, 1.20m));

        Assert.Equal(Montant.De(15.90m), new CalculDuPanier().Chiffrer(panier).SommeDesArticles);
    }

    [Fact] // @ac-3
    public void Un_panier_vide_vaut_zero()
    {
        Assert.Equal(Montant.Zero, new CalculDuPanier().Chiffrer(new Panier()).SommeDesArticles);
    }

    [Fact]
    public void Une_quantite_nulle_ou_negative_n_existe_pas()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Quantite.De(0));
        Assert.Throws<ArgumentOutOfRangeException>(() => Quantite.De(-2));
    }

    [Fact]
    public void Un_montant_negatif_n_existe_pas()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Montant.De(-0.01m));
    }
}
