# Contrats — US-2

Les signatures ci-dessous sont proposées pour étendre le point d'entrée existant ; elles ne décrivent pas du code déjà livré. Elles conservent les couches de l'ADR-001 et l'appel sans configuration des tests existants (`docs/adr/adr-001-decoupage-domaine-application.md:14-21` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`).

## Requête `ChiffrerLePanier`

Couche : Application

Réalisation par `CalculDuPanier`, sans message supplémentaire ni bus : le point d'entrée existant est une méthode de lecture (`src/Tarification.Application/CalculDuPanier.cs:19-22` ; `.skraft/us-2/design/event-model.md:6-15`).

```csharp
Facture Chiffrer(Panier panier, BaremeDeRemise bareme);
Facture Chiffrer(Panier panier);
```

| Paramètre | Forme et règles |
|---|---|
| `panier` | Agrégat `Panier` ; chaque `LigneDePanier` conserve `Reference`, `Quantite` et `PrixUnitaire`. La quantité se construit avec l'objet-valeur `Quantite` (entier ≥ 1) et le prix avec l'objet-valeur `Montant` (decimal ≥ 0). Aucun regroupement de lignes (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Domaine/Quantite.cs:10-12` ; `src/Tarification.Domaine/Montant.cs:13-14` ; `stories/US-2.md:10`). |
| `bareme` | objet-valeur `BaremeDeRemise`, identique pour toutes les références ; collection vide autorisée. La surcharge sans barème équivaut à un barème vide (`.skraft/us-2/research/research.md:9-11` ; `stories/US-2.md:11` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`). |

Les paramètres de référence sont non nullables, conformément à la compilation existante ; aucune nouvelle validation de `Reference` n'est ajoutée à la ligne existante (`Directory.Build.props:3-8` ; `src/Tarification.Domaine/LigneDePanier.cs:4`).

### Forme du retour : Vue `Facture`

| Champ | Type | Contrat |
|---|---|---|
| `SommeDesArticles` | objet-valeur `Montant` | Somme des sous-totaux bruts, inchangée (`src/Tarification.Domaine/Panier.cs:16` ; `src/Tarification.Domaine/LigneDePanier.cs:6`). |
| `Remise` | objet-valeur `Montant` | Somme des remises calculées indépendamment par ligne ; zéro sans palier éligible (`stories/US-2.md:7-11`). |
| `FraisDePort` | objet-valeur `Montant` | Reste à zéro dans ce cas d'usage, comme avant US-2 (`src/Tarification.Application/CalculDuPanier.cs:21`). |
| `ATPayer` | objet-valeur `Montant` | `SommeDesArticles - Remise + FraisDePort`, dès US-2 (`.skraft/us-2/design/clarifications.md:5-7`). |

Aucune mutation du panier ni publication d'événement : cette opération reste la lecture modélisée (`.skraft/us-2/design/event-model.md:6-11`).

## objet-valeur `TauxDeRemise`

Signature proposée : `static TauxDeRemise De(decimal pourcentage)`, propriété en lecture seule `decimal Pourcentage`. `De(5m)` représente 5 %, pas 500 %. Domaine autorisé : `[0m, 100m]`, bornes incluses (`stories/US-2.md:7-9` ; `.skraft/us-2/design/clarifications.md:5-7`).

Hors de ces bornes, la fabrique lève `ArgumentOutOfRangeException`, selon les fabriques existantes ; pas de normalisation silencieuse (`src/Tarification.Domaine/Montant.cs:11-14` ; `src/Tarification.Domaine/Quantite.cs:8-12`).

## objet-valeur `PalierDeRemise`

Signature proposée : `static PalierDeRemise De(Quantite seuil, TauxDeRemise taux)`. Propriétés en lecture seule `Seuil` et `Taux`. La fabrique vérifie `seuil.Valeur >= 1`, y compris si le seuil a été obtenu par `default(Quantite)`, et lève `ArgumentOutOfRangeException` sinon : elle reprend l'invariant et le rejet existants de l'objet-valeur `Quantite`. Le taux utilise les bornes clarifiées (`src/Tarification.Domaine/Quantite.cs:4-12` ; `.skraft/us-2/design/clarifications.md:5-7`).

Un palier est éligible si `ligne.Quantite.Valeur >= Seuil.Valeur` : le seuil exact est inclus (`stories/US-2.md:7-8`).

## objet-valeur `BaremeDeRemise`

Signatures proposées :

```csharp
static BaremeDeRemise De(params PalierDeRemise[] paliers);
Montant RemisePour(LigneDePanier ligne);
```

Le barème conserve une copie immuable des paliers fournis, sans exposer de collection modifiable ; il représente une valeur et non une configuration modifiable pendant un calcul. Cette propriété suit les règles des objets-valeurs (`.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:72-87`).

`De()` construit le barème vide. La fabrique vérifie aussi les seuils de ses paliers pour ne pas accepter un `default(PalierDeRemise)` dont le seuil vaut zéro ; elle applique la même garde ≥ 1 et le même rejet que l'objet-valeur `Quantite` (`src/Tarification.Domaine/Quantite.cs:4-12`).

Les doublons de seuil sont admis ; l'ordre des paliers ne détermine pas le résultat. Pour une ligne, filtrer les seuils atteints, calculer `ligne.SousTotal.Euros * taux.Pourcentage / 100m`, puis retenir uniquement le maximum des remises candidates. Sans candidat, retourner `Montant.Zero`. Ne pas additionner les taux ni présumer qu'ils croissent avec les seuils (`stories/US-2.md:7-11` ; `.skraft/us-2/design/clarifications.md:5-7` ; `.skraft/us-2/research/research.md:75`).

## Agrégat `Panier`

Signature proposée : `Montant SommeDesRemises(BaremeDeRemise bareme)`. Appliquer `bareme.RemisePour(ligne)` à chaque ligne puis additionner les montants, avec zéro pour le panier vide ; ne pas additionner les quantités, même avant la sélection des paliers (`stories/US-2.md:10-11` ; `src/Tarification.Domaine/Panier.cs:6-16`). La frontière est proposée dans `docs/adr/adr-003-frontiere-du-panier.md:19-29`.

`SommeDesLignes()` et `LigneDePanier.SousTotal` restent bruts ; l'application assemble la Vue `Facture` à partir des deux sommes (`src/Tarification.Domaine/Panier.cs:16` ; `src/Tarification.Domaine/LigneDePanier.cs:6` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-21`).

## objet-valeur `Montant`

Extensions proposées : `Montant Applique(TauxDeRemise taux)` pour le produit décimal par le pourcentage divisé par 100 ; `static Montant operator -(Montant a, Montant b)` pour déduire la remise. Un résultat négatif reste interdit par la garde de `De`, avec `ArgumentOutOfRangeException` ; le contrat ne crée pas de montant négatif (`stories/US-2.md:8-9` ; `.skraft/us-2/design/clarifications.md:5-7` ; `src/Tarification.Domaine/Montant.cs:13-14`).

Pas d'arrondi intermédiaire : les opérations conservent les décimales, la politique de rendu étant réservée à US-5 (`stories/US-5.md:7-9` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33`).

## Commandes, événements et dépôts

Aucun à contractualiser : le modèle ne définit qu'une requête, sans mutation, événement ni stockage. Aucun dépôt d'infrastructure ou autre port n'est ajouté (`.skraft/us-2/design/event-model.md:6-15` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42`).

## Exemples contractuels

| Critère | Lignes et paliers | `Remise` | `ATPayer` hors port |
|---|---|---|---|
| ac-1 | 9 × 2,00 € ; 10 → 5 % | 0,00 € | 18,00 € |
| ac-2 | 10 × 2,00 € ; 10 → 5 % | 1,00 € | 19,00 € |
| ac-3 | 50 × 2,00 € ; 10 → 5 %, 50 → 12 % | 12,00 € | 88,00 € |
| ac-4 | Deux références, deux lignes de 6 ; 10 → 5 % | 0,00 € | Somme brute des deux lignes |
| ac-5 | Barème vide | 0,00 € | Somme brute des lignes |

Les remises proviennent des cinq critères ; les totaux résultent de la déduction clarifiée. Aucun prix n'est inventé pour ac-4 (`stories/US-2.md:7-11` ; `.skraft/us-2/design/clarifications.md:5-7`).
