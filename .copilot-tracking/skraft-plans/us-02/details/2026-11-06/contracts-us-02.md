# Contracts — US-02 Remise par palier de quantité

## Contexte Tarification

Les contrats réutilisent le contexte et les valeurs décrits dans `docs/architecture/tarification.md` (sections « Valeurs et calcul » et « Entrée applicative et compatibilité »), conformément à ADR-001 et ADR-003.

## Query (Application): CalculDuPanier.Chiffrer
- `panier: Panier` — requis, panier existant fourni par l'appelant, lu sans mutation.
- `paliers: PaliersDeRemise` — requis dans la forme étendue ; instantané commun à toutes les références. Une collection vide signifie aucune remise.
- Validation : les invariants de `Panier`, `Quantite`, `Montant`, `PaliersDeRemise`, `PalierDeRemise` et `TauxDeRemise` s'appliquent ; les quantités et seuils sont positifs, les montants non négatifs et le taux est compris entre 0 et 100 inclus. Les seuils répétés sont admis, l'ordre des paliers est sans effet.
- Règle : chaque ligne est évaluée séparément ; le taux maximal admissible est retenu, sans cumul ni regroupement.
- Retour : `Facture`, Read Model comprenant montant des articles, remise totale, frais de port et montant à payer net. La remise totale ne dépasse pas les articles ; le montant à payer est articles − remise + frais de port. Aucun arrondi nouveau.
- Compatibilité : la forme existante `Chiffrer(panier: Panier): Facture` reste disponible et équivaut à `PaliersDeRemise` vide.

## Command
- Aucun pour US-02 : aucun état n'est modifié ou enregistré.

## Domain Event
- Aucun : la Query est pure et n'émet pas d'événement.

## Value Objects
- `TauxDeRemise` : taux décimal entre 0 et 100 inclus.
- `PalierDeRemise` : `seuil: Quantite`, `taux: TauxDeRemise`.
- `PaliersDeRemise` : collection immuable de `PalierDeRemise`, vide admise.
- `BilanArticles` : `articles: Montant`, `remise: Montant`.
- `ChiffrageDuPanier` : `bilan: BilanArticles`, `fraisDePort: Montant`; le montant à payer est calculé, non stocké.

Les Value Objects sont immuables, auto-validants et égaux par valeur. Les contrats de Domain n'introduisent aucun champ primitif nu dans ces valeurs.

## Repository et service interfaces
- Aucun repository : le panier est déjà fourni et cette slice n'a aucune lecture/écriture persistée.
- Aucun service ou Domain Service : le calcul appartient à `Panier` et `LigneDePanier` selon `docs/architecture/tarification.md`.
