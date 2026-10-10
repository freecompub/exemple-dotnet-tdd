namespace Tarification.Domaine;

// Signature provisoire ; validation et immuabilite restent a implementer dans la boucle interne.
public sealed record ConfigurationDePaliers(IReadOnlyList<PalierDeQuantite> Paliers);
