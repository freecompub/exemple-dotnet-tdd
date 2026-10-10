namespace Tarification.Domaine;

// Signature de DISTILL ; aucun comportement de remise n'est encore implémenté.
public sealed record PalierDeRemise(int Seuil, TauxDeRemise Taux);
