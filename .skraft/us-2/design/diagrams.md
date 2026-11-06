# Diagrammes — US-2 Remise par palier de quantité

Sources : `domain-model.md`, `event-model.md`, `contracts.md`, ADR-001
(`docs/adr/adr-001-decoupage-domaine-application.md:15-21`), ADR-003
(`docs/adr/adr-003-frontiere-du-panier-et-grille-de-remise.md`).

## Couches et dépendances

Une seule direction de dépendance (`adr-001:15-21`) ; les nouveaux types sont dans le domaine
(`domain-model.md:36-74`).

```mermaid
graph LR
    subgraph Application["Tarification.Application"]
        CalculDuPanier
        Facture
    end
    subgraph Domaine["Tarification.Domaine"]
        Panier
        LigneDePanier
        GrilleDeRemise
        PalierDeQuantite
        Pourcentage
        Montant
        Quantite
    end
    Application --> Domaine
```

## Modèle du domaine

Le `Panier` reste inchangé ; objet-valeur `GrilleDeRemise` hors de sa frontière (ADR-003).

```mermaid
classDiagram
    class Panier {
        <<Agrégat>>
        +IReadOnlyList~LigneDePanier~ Lignes
        +Ajoute(LigneDePanier) Panier
        +SommeDesLignes() Montant
    }
    class LigneDePanier {
        +Quantite Quantite
        +Montant SousTotal
    }
    class GrilleDeRemise {
        <<objet-valeur>>
        +De(params PalierDeQuantite[]) GrilleDeRemise$
        +Vide GrilleDeRemise$
        +RemisePour(LigneDePanier) Montant
        +RemisePour(Panier) Montant
    }
    class PalierDeQuantite {
        <<objet-valeur>>
        +Quantite Seuil
        +Pourcentage Taux
        +De(Quantite, Pourcentage) PalierDeQuantite$
        +EstAtteintPar(Quantite) bool
    }
    class Pourcentage {
        <<objet-valeur>>
        +decimal Valeur
        +De(decimal) Pourcentage$
        +Applique(Montant) Montant
    }
    class CalculDuPanier {
        +CalculDuPanier()
        +CalculDuPanier(GrilleDeRemise)
        +Chiffrer(Panier) Facture
    }
    class Facture {
        +Montant Remise
        +Montant ATPayer
    }
    Panier *-- "0..*" LigneDePanier
    GrilleDeRemise o-- "0..*" PalierDeQuantite
    PalierDeQuantite --> Pourcentage
    CalculDuPanier --> GrilleDeRemise
    CalculDuPanier ..> Panier
    CalculDuPanier ..> Facture
    GrilleDeRemise ..> LigneDePanier
```

## Requête `ChiffrerPanier`

Déroulé de `CalculDuPanier.Chiffrer` (`contracts.md`, section « Requête `ChiffrerPanier` »).

```mermaid
sequenceDiagram
    participant Appelant
    participant CalculDuPanier
    participant Panier
    participant GrilleDeRemise
    participant PalierDeQuantite
    participant Pourcentage
    Appelant->>CalculDuPanier: Chiffrer(panier)
    CalculDuPanier->>Panier: SommeDesLignes()
    Panier-->>CalculDuPanier: Montant
    CalculDuPanier->>GrilleDeRemise: RemisePour(panier)
    loop chaque ligne de panier.Lignes
        GrilleDeRemise->>PalierDeQuantite: EstAtteintPar(ligne.Quantite)
        PalierDeQuantite-->>GrilleDeRemise: bool
        alt aucun palier atteint
            GrilleDeRemise-->>GrilleDeRemise: Montant.Zero
        else au moins un palier atteint
            GrilleDeRemise->>Pourcentage: Applique(ligne.SousTotal) — taux maximal seul
            Pourcentage-->>GrilleDeRemise: Montant
        end
    end
    GrilleDeRemise-->>CalculDuPanier: somme des remises de ligne
    CalculDuPanier-->>Appelant: Facture (Remise = somme des remises de ligne)
```

## Timeline

Reprise de `event-model.md:52-62`.

```mermaid
timeline
    title US-2 — Remise par palier
    section Commande
        ConfigurerGrilleDeRemise : GrilleDeRemiseConfiguree
        AjouterLigneAuPanier : LigneAjouteeAuPanier
    section Requête
        ChiffrerPanier : CalculDuPanier.Chiffrer
    section Vue
        Facture : Remise = somme des remises par ligne
```
