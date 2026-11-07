# Diagrammes — US-2 : Remise par palier de quantité

Sources : `.skraft/us-2/design/domain-model.md`, `.skraft/us-2/design/event-model.md`,
`.skraft/us-2/design/contracts.md`.

## Dépendances entre couches

Une seule direction : l'application dépend du domaine, le domaine de rien
(`docs/adr/adr-001-decoupage-domaine-application.md:15-21`).

```mermaid
flowchart LR
    subgraph Application["Tarification.Application"]
        CalculDuPanier
        Facture
    end
    subgraph Domaine["Tarification.Domaine"]
        Panier
        LigneDePanier
        GrilleDePaliers
        PalierDeQuantite
        Pourcentage
        Montant
        Quantite
    end
    CalculDuPanier --> Panier
    CalculDuPanier --> GrilleDePaliers
    Facture --> Montant
```

## Modèle du domaine

Nouveaux : `GrilleDePaliers`, `PalierDeQuantite`, `Pourcentage`, `Panier.SommeDesRemises`,
`Montant.Applique` (`domain-model.md:12-22`). `GrilleDePaliers` n'est pas tenue par `Panier` : elle lui
est passée au calcul (`domain-model.md:30-31`).

```mermaid
classDiagram
    class Panier {
        +Lignes
        +Ajoute(LigneDePanier ligne) Panier
        +SommeDesLignes() Montant
        +SommeDesRemises(GrilleDePaliers grille) Montant
    }
    class LigneDePanier {
        +string Reference
        +Quantite Quantite
        +SousTotal Montant
    }
    class GrilleDePaliers {
        +Vide GrilleDePaliers$
        +De(PalierDeQuantite[] paliers) GrilleDePaliers$
        +RemisePour(LigneDePanier ligne) Montant
    }
    class PalierDeQuantite {
        +Quantite Seuil
        +Pourcentage Taux
    }
    class Pourcentage {
        +decimal Valeur
        +De(decimal valeur) Pourcentage$
    }
    class Montant {
        +decimal Euros
        +Applique(Pourcentage taux) Montant
    }
    class Quantite {
        +int Valeur
    }
    Panier "1" *-- "0..*" LigneDePanier
    Panier ..> GrilleDePaliers : paramètre
    GrilleDePaliers "1" o-- "0..*" PalierDeQuantite
    PalierDeQuantite --> Quantite
    PalierDeQuantite --> Pourcentage
    LigneDePanier --> Quantite
    LigneDePanier --> Montant
```

## Requête `ChiffrerPanier`

Calcul ligne par ligne, un seul palier retenu par ligne (`contracts.md`, section « Requête
`ChiffrerPanier` » ; `stories/US-2.md:9-10`).

```mermaid
sequenceDiagram
    participant Appelant
    participant CalculDuPanier
    participant Panier
    participant GrilleDePaliers
    participant Montant
    Appelant->>CalculDuPanier: new CalculDuPanier(grille) puis Chiffrer(panier)
    CalculDuPanier->>Panier: SommeDesLignes()
    Panier-->>CalculDuPanier: Montant
    CalculDuPanier->>Panier: SommeDesRemises(grille)
    loop chaque LigneDePanier
        Panier->>GrilleDePaliers: RemisePour(ligne)
        alt au moins un palier atteint
            GrilleDePaliers->>Montant: ligne.SousTotal.Applique(taux le plus élevé)
            Montant-->>GrilleDePaliers: remise de la ligne
        else aucun palier atteint ou grille vide
            GrilleDePaliers-->>GrilleDePaliers: Montant.Zero
        end
        GrilleDePaliers-->>Panier: remise de la ligne
    end
    Panier-->>CalculDuPanier: somme des remises
    CalculDuPanier-->>Appelant: Facture avec Remise renseignée
```

## Commande `AjouterLigne` → Événement `LigneAjoutee`

Existant, inchangé (`event-model.md:13,27-31`, `src/Tarification.Domaine/Panier.cs:10-14`).

```mermaid
flowchart LR
    AjouterLigne -->|Panier.Ajoute| Panier --> LigneAjoutee
```
