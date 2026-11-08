using System.Globalization;
using Reqnroll;
using Tarification.Application;
using Tarification.Domaine;
using Xunit;

namespace Tarification.UnitTests;

/// <summary>Le client de la boutique : prépare sa commande, la fait chiffrer, lit la remise.</summary>
internal sealed class ClientDeLaRemise
{
    private readonly List<PalierDeRemise> _paliers = [];
    private readonly Panier _panier = new();
    private Facture? _facture;

    public void ConnaitLePalier(string seuil, string taux) =>
        _paliers.Add(PalierDeRemise.De(Quantite.De(int.Parse(seuil, CultureInfo.InvariantCulture)), Pourcentage.De(decimal.Parse(taux, CultureInfo.InvariantCulture))));

    public void CommandeUneLigne(string reference, int quantite, string prix) =>
        _panier.Ajoute(new LigneDePanier(reference, Quantite.De(quantite), UnMontant(prix)));

    public void Chiffre() => _facture = new CalculDuPanier(BaremeDeRemises.De(_paliers)).Chiffrer(_panier);

    public void VoitUneRemiseDe(string remise)
    {
        Assert.NotNull(_facture);
        Assert.Equal(UnMontant(remise), _facture.Remise);
    }

    private static Montant UnMontant(string texte) =>
        Montant.De(decimal.Parse(texte.Replace(',', '.'), CultureInfo.InvariantCulture));
}

[Binding]
public sealed class RemiseParPalierSteps
{
    private const string PrixParDefaut = "1,00";

    private readonly ClientDeLaRemise _client = new();

    [Given(@"le palier « (\d+) articles ou plus : (\d+) % »")]
    public void UnPalier(string seuil, string taux) => _client.ConnaitLePalier(seuil, taux);

    [Given(@"les paliers « (\d+) : (\d+) % » et « (\d+) : (\d+) % »")]
    public void DeuxPaliers(string seuil1, string taux1, string seuil2, string taux2)
    {
        _client.ConnaitLePalier(seuil1, taux1);
        _client.ConnaitLePalier(seuil2, taux2);
    }

    [Given("aucun palier configuré")]
    public void AucunPalier()
    {
    }

    [Given(@"une commande d'une ligne ""([^""]+)"" de (\d+) articles à (\d+,\d+) €")]
    public void UneLigne(string reference, int quantite, string prix) =>
        _client.CommandeUneLigne(reference, quantite, prix);

    [Given(@"une commande de deux lignes de (\d+) articles de références différentes")]
    public void DeuxLignes(int quantite)
    {
        _client.CommandeUneLigne("MUG-01", quantite, PrixParDefaut);
        _client.CommandeUneLigne("STY-07", quantite, PrixParDefaut);
    }

    [When("le client chiffre sa commande")]
    public void Chiffre() => _client.Chiffre();

    [Then(@"la remise est de (\d+,\d+) €")]
    public void LaRemiseEst(string remise) => _client.VoitUneRemiseDe(remise);
}
