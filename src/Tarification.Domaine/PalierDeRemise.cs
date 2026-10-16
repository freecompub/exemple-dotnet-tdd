namespace Tarification.Domaine;

public readonly record struct PalierDeRemise
{
    // Signature provisoire DISTILL ; les règles seront introduites pendant DELIVER.
    public static PalierDeRemise De(Quantite seuil, TauxDeRemise taux) => default;
}
