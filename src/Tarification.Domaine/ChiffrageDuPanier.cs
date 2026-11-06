namespace Tarification.Domaine;

/// <summary>Le bilan des articles, les frais et le montant net à payer.</summary>
public sealed record ChiffrageDuPanier(BilanArticles Bilan, Montant FraisDePort)
{
    public Montant ATPayer => Bilan.Net + FraisDePort;
}
