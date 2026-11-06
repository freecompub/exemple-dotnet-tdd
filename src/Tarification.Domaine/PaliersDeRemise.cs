namespace Tarification.Domaine;

/// <summary>Les paliers communs à toutes les références ; vide quand aucun n'est configuré.</summary>
public sealed class PaliersDeRemise
{
    public static PaliersDeRemise De(params PalierDeRemise[] paliers) => new();
}
