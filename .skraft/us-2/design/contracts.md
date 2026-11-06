# Contrats — US-2 Remise par palier de quantité

Sources : `event-model.md` (commandes, requête, événements), `domain-model.md` (agrégat,
objets-valeurs, cas d'usage), ADR-003 (`docs/adr/adr-003-frontiere-du-panier-et-grille-de-remise.md`).
Couches : `Tarification.Domaine` et `Tarification.Application` (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`).
Montants en `decimal` (`adr-001:32-33`). Toute violation de règle lève `ArgumentOutOfRangeException`,
comme les fabriques existantes (`src/Tarification.Domaine/Montant.cs:13-14`, `src/Tarification.Domaine/Quantite.cs:10-11`).

## Commande `AjouterLigneAuPanier`

Existante, inchangée : `Panier Ajoute(LigneDePanier ligne)` sur le `Panier`
(`src/Tarification.Domaine/Panier.cs:10-14`), qui retourne le panier (API fluide). La ligne
`LigneDePanier` porte ses trois champs (`src/Tarification.Domaine/LigneDePanier.cs:4`).

| Champ | Type | Règle de validation | Source |
|---|---|---|---|
| référence | `string` | Aucune règle | `LigneDePanier.cs:4` |
| quantité | `Quantite` | Valeur ≥ 1 | `Quantite.cs:10-11` |
| prix unitaire | `Montant` | Euros ≥ 0 | `Montant.cs:13-14` |

Deux lignes de même référence restent deux lignes distinctes : `Ajoute` ne les fusionne pas
(`Panier.cs:10-14` ; `event-model.md:67-68`).

Produit : événement `LigneAjouteeAuPanier`.

## Commande `ConfigurerGrilleDeRemise`

Nouvelle. Réalisée par les fabriques de l'objet-valeur `GrilleDeRemise` (`domain-model.md:58-61`) :

```csharp
public static GrilleDeRemise De(params PalierDeQuantite[] paliers);
public static GrilleDeRemise Vide { get; }
```

Chaque palier est construit par les fabriques des objets-valeurs `PalierDeQuantite` et `Pourcentage`
(`domain-model.md:38-56`) :

```csharp
public static PalierDeQuantite De(Quantite seuil, Pourcentage taux);
public static Pourcentage De(decimal valeur); // valeur en pour-cent : 5 % → Pourcentage.De(5m)
```

| Champ | Type | Règle de validation | Source |
|---|---|---|---|
| `paliers` | `PalierDeQuantite[]` | Peut être vide (ac-5) ; seuils répétés ou taux non croissants admis | `domain-model.md:62-64`, `stories/US-2.md:11` |
| `paliers[i].Seuil` | `Quantite` | Valeur ≥ 1 | `Quantite.cs:10-11`, `domain-model.md:53-54` |
| `paliers[i].Taux` | `Pourcentage` | 0 ≤ valeur ≤ 100 | `domain-model.md:43-45` |

Rejet : un seuil < 1 ou un taux hors [0 ; 100] lève `ArgumentOutOfRangeException` à la construction
du palier (`event-model.md:25-26`).

Produit : événement `GrilleDeRemiseConfiguree`.

## Requête `ChiffrerPanier`

Réalisée par le cas d'usage `CalculDuPanier` (`src/Tarification.Application/CalculDuPanier.cs:19-22`),
étendu (`domain-model.md:76-80`) :

```csharp
public CalculDuPanier();                        // ≡ new CalculDuPanier(GrilleDeRemise.Vide)
public CalculDuPanier(GrilleDeRemise grille);
public Facture Chiffrer(Panier panier);
```

Paramètres :

| Paramètre | Type | Fourni | Règle |
|---|---|---|---|
| `grille` | `GrilleDeRemise` | à la construction du cas d'usage (`adr-001:28-30`) | absente → grille vide |
| `panier` | `Panier` | à l'appel de `Chiffrer` (`CalculDuPanier.cs:21`) | — |

Retour : vue `Facture` (`CalculDuPanier.cs:10-13`), forme inchangée.

| Champ | Type | Valeur |
|---|---|---|
| somme des articles (1er champ) | `Montant` | `panier.SommeDesLignes()` (`Panier.cs:16`) — inchangé |
| `Remise` | `Montant` | `grille.RemisePour(panier)` — aujourd'hui `Montant.Zero` (`CalculDuPanier.cs:21`) |
| frais de port (3e champ) | `Montant` | `Montant.Zero` — inchangé (`CalculDuPanier.cs:21`) |
| `ATPayer` | `Montant` | somme des articles + frais de port — inchangé, la remise n'y est pas soustraite (`CalculDuPanier.cs:12`, `event-model.md:71`) |

Règle de calcul de `Remise`, portée par l'objet-valeur `GrilleDeRemise` (`domain-model.md:65-74`) :

```csharp
public Montant RemisePour(LigneDePanier ligne);
public Montant RemisePour(Panier panier);   // somme de RemisePour(ligne) sur panier.Lignes
```

1. Pour chaque ligne, retenir les paliers dont `Seuil.Valeur ≤ ligne.Quantite.Valeur`
   (`PalierDeQuantite.EstAtteintPar`, `domain-model.md:55-56`).
2. Aucun palier retenu → `Montant.Zero` (ac-1, ac-4, ac-5).
3. Sinon, un seul palier : celui au `Taux` maximal (ac-3, `stories/US-2.md:9`) ;
   remise = `Taux.Applique(ligne.SousTotal)` = `Montant.De(SousTotal.Euros × valeur / 100)`, sans arrondi
   (`domain-model.md:46-48`).
4. Remise du panier = somme des remises de ligne ; jamais de cumul des quantités entre lignes (ac-4,
   `stories/US-2.md:10`).

Exemples attendus (`event-model.md:40-46`) :

| Critère | Grille | Lignes | `Remise` |
|---|---|---|---|
| ac-1 | {10 → 5 %} | 9 × 2,00 € | 0,00 € |
| ac-2 | {10 → 5 %} | 10 × 2,00 € | 1,00 € |
| ac-3 | {10 → 5 %, 50 → 12 %} | 50 × 2,00 € | 12,00 € |
| ac-4 | {10 → 5 %} | 6 × réf. A, 6 × réf. B | 0,00 € |
| ac-5 | {} | une ligne quelconque | 0,00 € |

## Événement `LigneAjouteeAuPanier`

Fait de la timeline, sans classe d'événement (`domain-model.md:84-86`, `adr-001:40-42`).

| Charge utile | Type | Source |
|---|---|---|
| référence | `string` | `LigneDePanier.cs:4` |
| quantité | `Quantite` | `LigneDePanier.cs:4` |
| prix unitaire | `Montant` | `LigneDePanier.cs:4` |

## Événement `GrilleDeRemiseConfiguree`

Fait de la timeline, sans classe d'événement (`domain-model.md:84-87`).

| Charge utile | Type | Source |
|---|---|---|
| paliers | liste en lecture seule de `PalierDeQuantite` (`Seuil` : `Quantite`, `Taux` : `Pourcentage`), éventuellement vide | `domain-model.md:52-53,60-62` |

## Dépôts

Aucun dépôt dans cette story : le `Panier` n'est pas persisté et l'objet-valeur `GrilleDeRemise`
est passé au cas d'usage (`domain-model.md:89-95`, ADR-003).
