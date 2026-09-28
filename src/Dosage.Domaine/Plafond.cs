namespace Dosage.Domaine;

/// <summary>
/// Plafond de dose défini par le médecin. Absent lorsque aucun plafond n'a été configuré :
/// c'est un cas métier, pas une valeur manquante à deviner.
/// </summary>
public sealed class Plafond
{
    private readonly Unite? _limite;

    private Plafond(Unite? limite) => _limite = limite;

    public static Plafond De(Unite limite) => new(limite);

    public static Plafond Aucun { get; } = new(null);

    public bool EstDefini => _limite.HasValue;

    /// <summary>Applique le plafond à une dose calculée, sans jamais l'augmenter.</summary>
    public Unite Appliquer(Unite calculee) => _limite is { } l && calculee.Depasse(l) ? l : calculee;

    public Unite Limite => _limite ?? throw new InvalidOperationException("Aucun plafond n'est défini.");
}
