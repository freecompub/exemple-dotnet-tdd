# Contrats — US-2 : Remise par palier de quantité

Sources : `.skraft/us-2/design/event-model.md`, `.skraft/us-2/design/domain-model.md`, code existant
cité ligne à ligne. Couches : `Tarification.Domaine` ne dépend de rien, `Tarification.Application`
dépend du domaine seul (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`).

## Décisions d'architecture

Aucun nouvel ADR pour US-2. Passage de chaque candidat au filtre d'éligibilité :

| Candidat | Verdict | Raison |
|---|---|---|
| Frontière de `Panier` (seul agrégat du modèle, `domain-model.md:44`) | Pas d'ADR nouveau | `Panier` est déjà nommé et placé dans le domaine par ADR-001 (`docs/adr/adr-001-decoupage-domaine-application.md:17-18`). US-2 lui ajoute un comportement de lecture, `SommeDesRemises`, sans changer sa frontière (`domain-model.md:30-31,41-42`). |
| `GrilleDePaliers` passée en paramètre plutôt que tenue par `Panier` | Pas d'ADR (Q1) | Déjà imposé : « une règle qui a besoin d'un élément extérieur […] il faut la lui passer » (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`). |
| Règle de palier dans le domaine, pas dans le cas d'usage | Pas d'ADR (Q1) | Déjà imposé (`docs/adr/adr-001-decoupage-domaine-application.md:25-26`) ; l'approche contraire a été écartée (`.skraft/us-2/research/research.md:77-81`). |
| Remise en `decimal`, sans arrondi | Pas d'ADR (Q1, Q4) | `decimal` imposé (`docs/adr/adr-001-decoupage-domaine-application.md:32-34`) ; absence d'arrondi choisie comme option la plus simple (`.skraft/us-2/passation.md:6`, `domain-model.md:77-78`). |
| Grille injectée par le constructeur de `CalculDuPanier` | Pas d'ADR (Q3) | Détail d'implémentation d'un seul cas d'usage, sans engagement transverse. Tranché ci-dessous, section « Requête `ChiffrerPanier` ». |
| CQRS avec bus, Event Sourcing, saga, couche anticorruption, découpage de contexte | Pas d'ADR (Q4) | Question non soulevée : un seul contexte, aucune relation (`context-map.md:17-22`), aucun mécanisme d'événements (`event-model.md:16-17`). |

## Commande `AjouterLigne`

Existante (US-1), inchangée : `Panier.Ajoute(LigneDePanier ligne) → Panier`
(`src/Tarification.Domaine/Panier.cs:10-14`). Elle sert de clause *Given* aux critères
(`event-model.md:27-31`).

| Champ | Type | Validation | Source |
|---|---|---|---|
| `Reference` | `string` | aucune règle dans le code ; deux références différentes forment deux lignes distinctes (ac-4) | `src/Tarification.Domaine/LigneDePanier.cs:4`, `stories/US-2.md:10` |
| `Quantite` | `Quantite` | `Quantite.De(int)` lève `ArgumentOutOfRangeException` si la valeur est < 1 | `src/Tarification.Domaine/Quantite.cs:10-11` |
| prix unitaire | `Montant` | `Montant.De(decimal)` lève `ArgumentOutOfRangeException` si la valeur est < 0 | `src/Tarification.Domaine/Montant.cs:13-14` |

Produit : `LigneAjoutee`.

## Requête `ChiffrerPanier`

Point d'entrée : `CalculDuPanier.Chiffrer` (`src/Tarification.Application/CalculDuPanier.cs:19-22`),
couche application. Ne modifie pas `Panier` (`event-model.md:11`).

### Paramètres

| Paramètre | Type | Où il entre | Règle |
|---|---|---|---|
| grille | `GrilleDePaliers` | constructeur `CalculDuPanier(GrilleDePaliers grille)` | grille unique, commune à toutes les références (`.skraft/us-2/passation.md:9`) ; vide autorisée (ac-5, `stories/US-2.md:11`) |
| — | — | constructeur sans argument `CalculDuPanier()` | équivaut à `CalculDuPanier(GrilleDePaliers.Vide)` : les tests existants appellent `new CalculDuPanier()` (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`) et doivent garder une remise nulle (`domain-model.md:18`) |
| panier | `Panier` | `Chiffrer(Panier panier)` | signature inchangée (`src/Tarification.Application/CalculDuPanier.cs:21`) |

Choix du constructeur plutôt qu'un paramètre de `Chiffrer` : la signature `Chiffrer(Panier)`, appelée
par les tests existants (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`), reste
identique ; la grille est une configuration, non une donnée propre à un panier (`event-model.md:19-23`).

### Retour : vue `Facture`

`Facture` porte trois montants : somme des articles, `Remise`, frais de port
(`src/Tarification.Application/CalculDuPanier.cs:10`) ; sa forme est inchangée (`domain-model.md:19`).

| Champ | Valeur après US-2 | Source |
|---|---|---|
| somme des articles | résultat de `SommeDesLignes` (inchangé) | `src/Tarification.Application/CalculDuPanier.cs:21`, `domain-model.md:105` |
| `Remise` | résultat de `SommeDesRemises` avec la grille (au lieu de `Montant.Zero`) | `domain-model.md:104-105` |
| frais de port | `Montant.Zero` (inchangé) | `src/Tarification.Application/CalculDuPanier.cs:21`, `domain-model.md:105` |
| `ATPayer` | somme des articles + frais de port (inchangé) | `src/Tarification.Application/CalculDuPanier.cs:12`, `domain-model.md:19` |

Aucun refus propre à la requête (`event-model.md:51-56`).

### Contrats du domaine appelés

| Membre | Signature | Règle | Source |
|---|---|---|---|
| `Panier.SommeDesRemises` | `Montant SommeDesRemises(GrilleDePaliers grille)` | somme de `grille.RemisePour(ligne)` sur `Lignes`, chaque ligne indépendamment (ac-4) ; panier vide → `Montant.Zero` | `domain-model.md:35-42`, patron `src/Tarification.Domaine/Panier.cs:16` |
| `GrilleDePaliers.Vide` | `static GrilleDePaliers Vide { get; }` | grille sans palier | `domain-model.md:64` |
| `GrilleDePaliers.De` | `static GrilleDePaliers De(params PalierDeQuantite[] paliers)` | aucune validation de doublon ni d'ordre ; zéro palier accepté | `domain-model.md:62-63,70-73` |
| `GrilleDePaliers.RemisePour` | `Montant RemisePour(LigneDePanier ligne)` | parmi les `PalierDeQuantite` tels que `ligne.Quantite.Valeur >= Seuil.Valeur`, retient le seul au `Taux` le plus élevé ; remise = `ligne.SousTotal.Applique(Taux)` ; aucun palier atteint → `Montant.Zero` | `domain-model.md:65-69`, `stories/US-2.md:7-9` |
| `PalierDeQuantite` | `sealed record PalierDeQuantite(Quantite Seuil, Pourcentage Taux)` | seuil ≥ 1, porté par `Quantite.De` | `domain-model.md:55-59`, `src/Tarification.Domaine/Quantite.cs:10-11` |
| `Pourcentage.De` | `static Pourcentage De(decimal valeur)` | lève `ArgumentOutOfRangeException` si `valeur < 0` ; `readonly record struct`, constructeur privé | `domain-model.md:48-53` |
| `Montant.Applique` | `Montant Applique(Pourcentage taux)` | `Euros × taux / 100` en `decimal`, sans arrondi | `domain-model.md:75-78`, `.skraft/us-2/passation.md:6` |

Vérification sur les critères (`stories/US-2.md:7-11`, `.skraft/us-2/research/research.md:58`) :
ac-1 9 < 10 → 0,00 € ; ac-2 20,00 × 5 / 100 = 1,00 € ; ac-3 taux retenu 12 > 5 → 100,00 × 12 / 100 =
12,00 € ; ac-4 6 < 10 sur chaque ligne → 0,00 € ; ac-5 `GrilleDePaliers.Vide` → 0,00 €.

## Événement `LigneAjoutee`

Événement de modèle, sans mécanisme dans le code (`event-model.md:16-17`,
`src/Tarification.Domaine/Panier.cs:10-14`). US-2 ne le modifie pas.

| Champ | Type | Source |
|---|---|---|
| `Reference` | `string` | `src/Tarification.Domaine/LigneDePanier.cs:4` |
| `Quantite` | `Quantite` | `src/Tarification.Domaine/LigneDePanier.cs:4` |
| prix unitaire | `Montant` | `src/Tarification.Domaine/LigneDePanier.cs:4`, `domain-model.md:87` |

## Dépôts

Aucun contrat de dépôt pour US-2 (`domain-model.md`, section « Interfaces de dépôt ») : aucun critère ne
conserve ni ne charge de panier (`stories/US-2.md:7-11`). Le cas d'usage reçoit `Panier` en paramètre
(`src/Tarification.Application/CalculDuPanier.cs:21`), et le projet n'a pas de stockage
(`docs/adr/adr-001-decoupage-domaine-application.md:40-42`).
