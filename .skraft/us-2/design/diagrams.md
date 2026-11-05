# Diagrams — US-2 — Remise par palier de quantité

Mêmes catégories que `contracts.md` et `domain-model.md` : agrégat `Panier`, objets-valeurs
`Montant`, `Quantite`, `PalierDeRemise`, `GrilleDeRemise`, requête `Chiffrer`.

## Diagramme de classes — domaine et application

```mermaid
classDiagram
    class Panier {
        <<Agrégat>>
        -List~LigneDePanier~ _lignes
        +Lignes IReadOnlyList~LigneDePanier~
        +Ajoute(LigneDePanier) Panier
        +SommeDesLignes() Montant
    }

    class LigneDePanier {
        <<Entité interne au Panier>>
        +Reference string
        +Quantite Quantite
        +PrixUnitaire Montant
        +SousTotal Montant
        +Remise(GrilleDeRemise) Montant
    }

    class Montant {
        <<objet-valeur>>
        +Euros decimal
        +De(decimal) Montant
        +Zero Montant
        +Multiplie(int) Montant
        +Pourcentage(decimal) Montant
    }

    class Quantite {
        <<objet-valeur>>
        +Valeur int
        +De(int) Quantite
    }

    class PalierDeRemise {
        <<objet-valeur>>
        +SeuilMinimal Quantite
        +Taux decimal
        +De(Quantite, decimal) PalierDeRemise
    }

    class GrilleDeRemise {
        <<objet-valeur>>
        +Vide GrilleDeRemise
        +De(IEnumerable~PalierDeRemise~) GrilleDeRemise
        +PalierLePlusAvantageux(Quantite) PalierDeRemise?
    }

    class CalculDuPanier {
        <<Requête>>
        +Chiffrer(Panier, GrilleDeRemise) Facture
    }

    class Facture {
        <<Vue>>
        +SommeDesArticles Montant
        +Remise Montant
        +FraisDePort Montant
        +ATPayer Montant
    }

    Panier "1" o-- "0..*" LigneDePanier
    LigneDePanier --> Quantite
    LigneDePanier --> Montant
    LigneDePanier ..> GrilleDeRemise : consulte
    GrilleDeRemise "1" o-- "0..*" PalierDeRemise
    PalierDeRemise --> Quantite
    CalculDuPanier ..> Panier : lit
    CalculDuPanier ..> GrilleDeRemise : reçoit
    CalculDuPanier ..> Facture : produit
    Facture --> Montant
```

Source des bornes de dépendance : `Tarification.Domaine` (en-dessous du trait) ne dépend de rien ;
`Tarification.Application` (`CalculDuPanier`, `Facture`) dépend du domaine et de lui seul
(`docs/adr/adr-001-decoupage-domaine-application.md`, section Décision).

## Diagramme de séquence — requête `Chiffrer` (AC-3 : deux paliers, un seul retenu)

```mermaid
sequenceDiagram
    participant Appelant as Test d'acceptance
    participant Calcul as CalculDuPanier
    participant Panier as Panier
    participant Ligne as LigneDePanier
    participant Grille as GrilleDeRemise

    Appelant->>Calcul: Chiffrer(panier, grille)
    Calcul->>Panier: SommeDesLignes()
    Panier-->>Calcul: Montant (somme brute)
    loop pour chaque ligne du panier
        Calcul->>Ligne: Remise(grille)
        Ligne->>Grille: PalierLePlusAvantageux(Quantite)
        Grille-->>Ligne: PalierDeRemise? (ex. 12 % pour 50 articles, AC-3)
        Ligne-->>Calcul: Montant (remise de cette ligne seule)
    end
    Calcul-->>Appelant: Facture(SommeDesArticles, Remise = Σ remises de ligne, FraisDePort)
```

## Diagramme d'état — sélection du palier le plus avantageux (AC-1, AC-2, AC-3, AC-5)

```mermaid
flowchart TD
    A[Quantite de la ligne] --> B{Un palier de la grille a<br/>SeuilMinimal <= Quantite ?}
    B -- non --> C[Remise = Montant.Zero<br/>AC-1 : 9 articles, AC-5 : grille vide]
    B -- oui --> D[Parmi les paliers atteints,<br/>retenir celui au Taux le plus eleve]
    D --> E[Remise = SousTotal.Pourcentage Taux<br/>AC-2 : 5 % de 10 articles, AC-3 : 12 % retenu sur 50 articles]
```

AC-4 n'apparaît dans aucun diagramme ci-dessus comme un cas particulier : la boucle du diagramme
de séquence applique `Remise` ligne par ligne, chaque ligne ne consultant que sa propre
`Quantite` — deux lignes de 6 articles de références différentes produisent chacune une remise
nulle sans qu'aucune donnée ne soit partagée entre elles.
