# Event Model — US-2 — Remise par palier de quantité

## Réutilisation

- `CalculDuPanier.Chiffrer(Panier) → Facture` est déjà le déclencheur de la story (source :
  `src/Tarification.Application/CalculDuPanier.cs:19-20`, dossier de passation « Existant
  réutilisable »). Aucun nouveau déclencheur n'est créé : US-2 étend le résultat produit par ce
  même déclencheur, elle n'en ajoute pas un second.
- `Panier`, `LigneDePanier`, `Montant`, `Quantite` sont réutilisés tels quels comme supports des
  données entrant dans ce déclencheur (`src/Tarification.Domaine/Panier.cs`,
  `LigneDePanier.cs`, `Montant.cs`, `Quantite.cs`).

## Déclencheur

`Chiffrer` ne modifie aucun état persistant : il n'y a ni dépôt ni stockage dans ce projet
(`docs/adr/adr-001-decoupage-domaine-application.md`, Alternatives — « une couche infrastructure
dès maintenant » explicitement écartée). `Chiffrer` lit un `Panier` déjà construit en mémoire et
retourne une vue calculée : c'est donc une **requête**, pas une commande — comme c'était déjà le
cas pour US-1 (`tests/Tarification.Tests/CalculDuPanierTests.cs:16-33`, qui pilote `Chiffrer` sans
jamais vérifier un événement émis).

Conséquence : aucun événement au passé n'est produit par cette tranche. Une requête sans effet de
bord ne «  peut pas être rejetée » au sens où une commande l'est — elle ne modélise pas une
décision, mais un calcul déterministe à partir de données déjà valides (`Panier` et ses
`LigneDePanier` sont déjà validés à la construction par leurs propres fabriques `De(...)`).

| Déclencheur | Nature | Résultat |
|---|---|---|
| Requête `Chiffrer` | lecture (aucun changement d'état) | Vue `Facture` |

Requête `Chiffrer` → vue `Facture`

## Tranche verticale

```
[Requête Chiffrer] → [Vue Facture]
```

Un seul slice couvre les 5 critères d'acceptation : chacun ne change que les données d'entrée
(quantité, nombre de paliers configurés, nombre de lignes) et l'attendu sur le champ `Remise` de
la vue `Facture` produite.

| AC | Entrée (`Panier` + paliers) | Sortie attendue sur `Facture.Remise` |
|---|---|---|
| 1 | 1 ligne de 9 × 2,00 €, palier « 10+ : 5 % » | 0,00 € |
| 2 | 1 ligne de 10 × 2,00 €, palier « 10+ : 5 % » | 1,00 € |
| 3 | 1 ligne de 50 × 2,00 €, paliers « 10+ : 5 % » et « 50+ : 12 % » | 12,00 € (un seul palier retenu, le plus avantageux) |
| 4 | 2 lignes de 6 articles de références différentes, palier « 10+ : 5 % » | 0,00 € (pas de cumul de quantités entre lignes) |
| 5 | 1 ligne, aucun palier configuré | 0,00 € |

## Vue

`Facture` existe déjà (`src/Tarification.Application/CalculDuPanier.cs:11`). US-2 remplace la
valeur figée `Montant.Zero` de son champ `Remise` (ligne 20 du même fichier) par le résultat d'un
calcul réel ; la forme du type ne change pas.

## Point laissé à l'architecture

`Facture.ATPayer => SommeDesArticles + FraisDePort` ne soustrait pas `Remise`
(`CalculDuPanier.cs:11`). Aucun des 5 critères d'acceptation d'US-2 ne teste `ATPayer` : ce point
n'est donc pas tranché ici et reste un défaut pré-existant, hors du périmètre de cette story — à
signaler, pas à corriger dans cette phase.
