namespace Tarification.Domaine;

public readonly record struct BaremeDeRemise
{
    // Signature provisoire DISTILL ; les règles seront introduites pendant DELIVER.
    public static BaremeDeRemise De(params PalierDeRemise[] paliers) => default;
}
