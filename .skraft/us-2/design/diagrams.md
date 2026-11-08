# Diagrammes — US-2 Remise par palier de quantité

Sources : `.skraft/us-2/design/domain-model.md`, `.skraft/us-2/design/contracts.md`,
`docs/adr/adr-003-remise-par-palier-dans-l-agregat-panier.md`.

## Couches et dépendances

Il y a deux couches et une seule direction de dépendance (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`).

```mermaid
flowchart LR
    subgraph Application["Tarification.Application"]
        CalculDuPanier["cas d'usage CalculDuPanier"]
        Facture["vue Facture"]
    end
    subgraph Domaine["Tarification.Domaine"]
        Panier["Agrégat Panier"]
        LigneDePanier
        BaremeDeRemises["objet-valeur BaremeDeRemises"]
        PalierDeRemise["objet-valeur PalierDeRemise"]
        Pourcentage["objet-valeur Pourcentage"]
        Montant
        Quantite
    end
    CalculDuPanier --> Panier
    CalculDuPanier --> BaremeDeRemises
    CalculDuPanier --> Facture
    Application --> Domaine
```

## Modèle du domaine

```mermaid
classDiagram
    class Panier {
        +Lignes
        +Ajoute(LigneDePanier) Panier
        +SommeDesLignes() Montant
        +RemiseDesLignes(BaremeDeRemises) Montant
    }
    class LigneDePanier {
        +Quantite Quantite
        +Montant SousTotal
    }
    class BaremeDeRemises {
        +Aucun$ BaremeDeRemises
        +RemiseDe(LigneDePanier) Montant
    }
    class PalierDeRemise {
        +Quantite Seuil
        +Pourcentage Taux
        +EstAtteintPar(Quantite) bool
    }
    class Pourcentage {
        +Applique(Montant) Montant
    }
    Panier "1" *-- "*" LigneDePanier
    BaremeDeRemises "1" o-- "*" PalierDeRemise
    PalierDeRemise --> Quantite
    PalierDeRemise --> Pourcentage
    Panier ..> BaremeDeRemises : passé en argument
```

L'Agrégat `Panier` ne garde pas de référence au barème : celui-ci est passé en argument (ADR-003).

## Séquence de la Requête `ChiffrerLePanier`

```mermaid
sequenceDiagram
    participant Appelant
    participant C as CalculDuPanier
    participant P as Panier
    participant B as BaremeDeRemises
    Appelant->>C: new CalculDuPanier(bareme) / new CalculDuPanier()
    Appelant->>C: Chiffrer(panier)
    C->>P: SommeDesLignes()
    P-->>C: Montant
    C->>P: RemiseDesLignes(bareme)
    loop pour chaque LigneDePanier
        P->>B: RemiseDe(ligne)
        B-->>P: Taux du palier atteint le plus élevé appliqué à SousTotal, sinon Montant.Zero
    end
    P-->>C: somme des remises
    C-->>Appelant: Facture(SommeDesArticles, Remise, FraisDePort = Montant.Zero)
```
