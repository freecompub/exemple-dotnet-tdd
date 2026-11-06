namespace Tarification.Domaine;

/// <summary>Les paliers de remise par quantité, les mêmes pour toutes les références.</summary>
public sealed class GrilleDeRemise
{
    private GrilleDeRemise(PalierDeQuantite[] paliers) => Paliers = paliers;

    public IReadOnlyList<PalierDeQuantite> Paliers { get; }

    public static GrilleDeRemise Vide { get; } = new([]);

    public static GrilleDeRemise De(params PalierDeQuantite[] paliers) => new(paliers);

    // Bouchon : une remise arbitraire, ni nulle ni égale à une valeur attendue, pour que chaque
    // scénario échoue sur son assertion tant que la règle n'est pas implémentée.
    public Montant RemisePour(Panier panier) => Montant.De(0.01m);
}
