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
    private Facture? _facture;

    [Given("un panier vide")]
    public void UnPanierVide() => _panier = new Panier();

    [Given(@"une ligne ""([^""]+)"" de (\d+) articles à (\d+(?:\.\d+)?) euros")]
    public void UneLigne(string reference, int quantite, string prix)
    {
        _panier.Ajoute(new LigneDePanier(
            reference, Quantite.De(quantite), Montant.De(decimal.Parse(prix, CultureInfo.InvariantCulture))));
    }

    [When("le client chiffre son panier")]
    public void ChiffrerLePanier() => _facture = new CalculDuPanier().Chiffrer(_panier);

    [Then(@"la somme des articles est de (\d+(?:\.\d+)?) euros")]
    public void VerifierLaSomme(string somme)
    {
        Assert.NotNull(_facture);
        Assert.Equal(Montant.De(decimal.Parse(somme, CultureInfo.InvariantCulture)), _facture.SommeDesArticles);
    }
}
