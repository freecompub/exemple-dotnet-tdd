# Diagrammes — US-2 : Remise par palier de quantité

Noms utilisés : uniquement ceux définis dans `domain-model.md` et `event-model.md`.

## Diagramme de classes — nouveaux objets-valeurs et leurs relations

```mermaid
classDiagram
    class Montant {
        +decimal Euros
        +Montant Multiplie(int facteur)
        +Montant Multiplie(Taux taux)
        +Montant Soustrait(Montant autre)
    }
    class Quantite {
        +int Valeur
    }
    class Taux {
        +decimal Valeur
    }
    class Palier {
        +Quantite Seuil
        +Taux Taux
    }
    class GrilleDePaliers {
        +Palier~nullable~ PalierApplicable(Quantite quantite)
    }
    class LigneDePanier {
        +string Reference
        +Quantite Quantite
        +Montant PrixUnitaire
        +Montant SousTotal
        +Montant Remise(GrilleDePaliers grille)
    }
    class Panier {
        +IReadOnlyList~LigneDePanier~ Lignes
        +Montant SommeDesLignes()
        +Montant SommeDesRemises(GrilleDePaliers grille)
    }
    class Facture {
        +Montant SommeDesArticles
        +Montant Remise
        +Montant FraisDePort
        +Montant ATPayer
    }
    class CalculDuPanier {
        +Facture Chiffrer(Panier panier, GrilleDePaliers grille)
    }

    Palier --> Quantite : Seuil
    Palier --> Taux : Taux
    GrilleDePaliers --> Palier : contient *
    LigneDePanier --> Quantite
    LigneDePanier --> Montant : PrixUnitaire
    LigneDePanier ..> GrilleDePaliers : reçue en paramètre (Remise)
    Panier --> LigneDePanier : contient *
    Panier ..> GrilleDePaliers : reçue en paramètre (SommeDesRemises)
    CalculDuPanier ..> Panier
    CalculDuPanier ..> GrilleDePaliers
    CalculDuPanier --> Facture : produit
```

Note : `GrilleDePaliers` n'est jamais stockée sur `LigneDePanier` ni sur `Panier` — c'est un
paramètre transmis à chaque appel, conformément à la réponse utilisateur (grille globale, pas
d'association par référence).

## Séquence — `ChiffrerPanier` (commande unique du modèle d'événements)

```mermaid
sequenceDiagram
    participant Client
    participant CalculDuPanier
    participant Panier
    participant LigneDePanier
    participant GrilleDePaliers

    Client->>CalculDuPanier: Chiffrer(panier, grille)
    CalculDuPanier->>Panier: SommeDesLignes()
    Panier-->>CalculDuPanier: Montant (somme des SousTotal)
    CalculDuPanier->>Panier: SommeDesRemises(grille)
    loop pour chaque LigneDePanier
        Panier->>LigneDePanier: Remise(grille)
        LigneDePanier->>GrilleDePaliers: PalierApplicable(Quantite)
        GrilleDePaliers-->>LigneDePanier: Palier ou rien
        LigneDePanier-->>Panier: Montant (remise de la ligne, 0 si rien)
    end
    Panier-->>CalculDuPanier: Montant (somme des remises)
    CalculDuPanier-->>Client: Facture (PanierChiffre)
```

Chaque appel `LigneDePanier.Remise(grille)` est indépendant des autres lignes : aucune donnée
partagée entre deux itérations de la boucle, ce qui illustre le critère 4 (pas d'agrégation
inter-lignes avant calcul de remise).

## Flux de décision — sélection du palier applicable

```mermaid
flowchart TD
    A[Quantite de la ligne] --> B{GrilleDePaliers vide ?}
    B -- oui --> Z[Remise = Montant.Zero]
    B -- non --> C{Au moins un Palier avec Seuil <= Quantite ?}
    C -- non --> Z
    C -- oui --> D[Retenir le Palier au Taux le plus élevé parmi ceux atteints]
    D --> E[Remise = SousTotal x Taux retenu]
```
