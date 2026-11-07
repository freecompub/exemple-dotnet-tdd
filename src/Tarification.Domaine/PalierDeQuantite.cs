namespace Tarification.Domaine;

/// <summary>À partir de ce nombre d'articles d'une même référence, ce taux de remise s'applique.</summary>
public sealed record PalierDeQuantite(Quantite Seuil, Pourcentage Taux);
