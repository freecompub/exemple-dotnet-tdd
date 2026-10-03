namespace Tarification.Domaine;

/// <summary>Un couple seuil/taux : « à partir de X articles, Y % de remise ».</summary>
public readonly record struct Palier(Quantite Seuil, Taux Taux);
