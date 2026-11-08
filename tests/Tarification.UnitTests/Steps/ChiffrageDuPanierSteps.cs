using System.Globalization;
using Reqnroll;
using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.UnitTests;

[Binding]
public sealed class ChiffrageDuPanierSteps
{
    private Panier _panier = new();
    private readonly List<PalierDeQuantite> _paliers = [];
    private Facture? _facture;

    [Given("un panier vide")]
    public void UnPanierVide() => _panier = new Panier();

    [Given(@"une ligne ""([^""]+)"" de (\d+) articles à (\d+(?:\.\d+)?) euros")]
    public void UneLigne(string reference, int quantite, string prix)
    {
        _panier.Ajoute(new LigneDePanier(
            reference, Quantite.De(quantite), Montant.De(decimal.Parse(prix, CultureInfo.InvariantCulture))));
    }

    [Given(@"le palier « (\d+) articles ou plus : (\d+) % »")]
    [Given(@"le palier « (\d+) : (\d+) % »")]
    public void UnPalier(int seuil, decimal taux) =>
        _paliers.Add(PalierDeQuantite.De(Quantite.De(seuil), TauxDeRemise.De(taux)));

    [Given("aucun palier configuré")]
    public void AucunPalier() => _paliers.Clear();

    [Given(@"une ligne de (\d+) articles à (\d+,\d+) €")]
    public void UneLigneAuPrix(int quantite, string prix) =>
        _panier.Ajoute(new LigneDePanier("REF-DEFAUT", Quantite.De(quantite), Montant.De(Decimal(prix))));

    [Given(@"une ligne de (\d+) articles de référence ""([^""]+)""")]
    public void UneLigneDeReference(int quantite, string reference) =>
        _panier.Ajoute(new LigneDePanier(reference, Quantite.De(quantite), PrixParDefaut));

    [Given("une ligne quelconque")]
    public void UneLigneQuelconque() =>
        _panier.Ajoute(new LigneDePanier("REF-DEFAUT", Quantite.De(1), PrixParDefaut));

    [When("le client chiffre son panier")]
    public void ChiffrerLePanier() =>
        _facture = new CalculDuPanier(GrilleDePaliers.De(_paliers.ToArray())).Chiffrer(_panier);

    [Then(@"la remise est de (\d+,\d+) €")]
    public void VerifierLaRemise(string remise)
    {
        Assert.NotNull(_facture);
        Assert.Equal(Montant.De(Decimal(remise)), _facture.Remise);
    }

    private static readonly Montant PrixParDefaut = Montant.De(1m);

    private static decimal Decimal(string valeur) =>
        decimal.Parse(valeur, new NumberFormatInfo { NumberDecimalSeparator = "," });

    [Then(@"la somme des articles est de (\d+(?:\.\d+)?) euros")]
    public void VerifierLaSomme(string somme)
    {
        Assert.NotNull(_facture);
        Assert.Equal(Montant.De(decimal.Parse(somme, CultureInfo.InvariantCulture)), _facture.SommeDesArticles);
    }
}
