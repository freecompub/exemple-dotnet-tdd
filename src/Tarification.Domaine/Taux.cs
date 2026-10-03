namespace Tarification.Domaine;

/// <summary>
/// Un taux de remise (ex. 5 % s'écrit <c>Taux.De(0.05m)</c>). Bouchon DISTILL : aucune validation
/// de borne n'est posée ici, aucun critère d'acceptation n'exerçant de valeur hors intervalle
/// (voir .skraft/us-2/distill/impl-plan.md).
/// </summary>
public readonly record struct Taux
{
    public decimal Valeur { get; }

    private Taux(decimal valeur) => Valeur = valeur;

    public static Taux De(decimal valeur) => new(valeur);
}
