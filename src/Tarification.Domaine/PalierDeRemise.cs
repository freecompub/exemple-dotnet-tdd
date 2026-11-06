namespace Tarification.Domaine;

/// <summary>Un seuil de quantité de ligne et le taux de remise qu'il ouvre.</summary>
public readonly record struct PalierDeRemise(Quantite Seuil, TauxDeRemise Taux);
