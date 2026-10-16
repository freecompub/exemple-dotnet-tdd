namespace Tarification.Domaine;

public readonly record struct TauxDeRemise
{
    // Signature provisoire DISTILL ; les règles seront introduites pendant DELIVER.
    public static TauxDeRemise De(decimal pourcentage) => default;
}
