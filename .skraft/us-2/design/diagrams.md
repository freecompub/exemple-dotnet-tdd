# Diagrams — US-2 Remise par palier de quantité

Sources : `contracts.md`, `domain-model.md`, `event-model.md`, couches selon
`docs/adr/adr-001-decoupage-domaine-application.md:17-21`.

## Couches et dépendances

Le domaine ne dépend de rien ; l'application dépend du domaine seul (`adr-001:15-21`).

```mermaid
graph LR
    subgraph Application["Tarification.Application"]
        CalculDuPanier
        Facture
    end
    subgraph Domaine["Tarification.Domaine"]
        Panier
        LigneDePanier
        GrilleDePaliers
        PalierDeQuantite
        TauxDeRemise
        Montant
        Quantite
    end
    CalculDuPanier --> Panier
    CalculDuPanier --> GrilleDePaliers
    Facture --> Montant
```

## Modèle du domaine

```mermaid
classDiagram
    class Panier {
        +Ajoute(LigneDePanier) Panier
        +SommeDesLignes() Montant
        +SommeDesRemises(GrilleDePaliers) Montant
    }
    class LigneDePanier {
        +Quantite : Quantite
        +SousTotal : Montant
    }
    class GrilleDePaliers {
        +Vide$ : GrilleDePaliers
        +RemisePour(LigneDePanier) Montant
    }
    class PalierDeQuantite {
        +Seuil : Quantite
        +Taux : TauxDeRemise
        +EstAtteintPar(Quantite) bool
    }
    class TauxDeRemise
    class Montant
    class Quantite
    Panier "1" *-- "0..*" LigneDePanier
    GrilleDePaliers "1" o-- "0..*" PalierDeQuantite
    PalierDeQuantite --> Quantite
    PalierDeQuantite --> TauxDeRemise
    Panier ..> GrilleDePaliers : argument
```

## Séquence de la requête `ChiffrerLePanier`

```mermaid
sequenceDiagram
    participant CalculDuPanier
    participant Panier
    participant GrilleDePaliers
    CalculDuPanier->>Panier: SommeDesLignes()
    Panier-->>CalculDuPanier: Montant
    CalculDuPanier->>Panier: SommeDesRemises(GrilleDePaliers)
    loop pour chaque LigneDePanier
        Panier->>GrilleDePaliers: RemisePour(LigneDePanier)
        alt au moins un palier atteint
            GrilleDePaliers-->>Panier: SousTotal × taux le plus élevé / 100
        else aucun palier atteint ou grille Vide
            GrilleDePaliers-->>Panier: Montant.Zero
        end
    end
    Panier-->>CalculDuPanier: Montant (somme des remises)
    Note over CalculDuPanier: renvoie la vue Facture, Facture.Remise renseignée
```

La remise n'entre pas dans `ATPayer` (`CalculDuPanier.cs:12`, `passation.md:9`).
