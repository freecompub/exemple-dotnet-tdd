namespace Tarification.Domaine;

/// <summary>Les articles et la remise appliquée, avant les frais de port.</summary>
public sealed record BilanArticles
{
    public Montant Articles { get; }
    public Montant Remise { get; }

    public BilanArticles(Montant articles, Montant remise)
    {
        _ = articles.Moins(remise);
        Articles = articles;
        Remise = remise;
    }

    public Montant Net => Articles.Moins(Remise);
}
