# Plan de test — US-2 : Remise par palier de quantité

## Traçabilité AC → scénario → test

| AC | Scénario (`.feature`) | Test d'acceptance | Rôle |
|---|---|---|---|
| 1 | Palier « 10 articles ou plus : 5 % » non atteint par une ligne de 9 articles | `Ac1_Palier_10_articles_ou_plus_5_pct_non_atteint_par_une_ligne_de_9_articles_a_2_00` | nouveau |
| 2 | Palier « 10 articles ou plus : 5 % » atteint par une ligne de 10 articles | `Ac2_Palier_10_articles_ou_plus_5_pct_atteint_par_une_ligne_de_10_articles_a_2_00` | nouveau |
| 3 | Un seul palier, le plus avantageux, s'applique parmi plusieurs paliers atteints | `Ac3_Un_seul_palier_le_plus_avantageux_s_applique_parmi_10_5_pct_et_50_12_pct` | nouveau |
| 4 | La remise se calcule par ligne, jamais sur le panier entier | `Ac4_La_remise_se_calcule_par_ligne_deux_lignes_de_6_articles_ne_declenchent_pas_le_palier_de_10` | nouveau |
| 5 | Aucun palier configuré ne produit aucune remise | `Ac5_Aucun_palier_configure_la_remise_est_de_0_00` | nouveau |

Fichier de tests : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs`.

## Frontière d'entrée

Tous les scénarios entrent par le même cas d'usage applicatif : `CalculDuPanier.Chiffrer(Panier,
GrilleDePaliers)` (voir `design/contracts.md`). Aucun double n'est nécessaire : ni persistance, ni
dépôt, ni service externe — toute la story est un calcul synchrone en mémoire (voir
`design/event-model.md`, section « Slice unique »). Stratégie de squelette marchant : **A — tout en
mémoire**.

## Matrice de couverture

| Scénario | Frontière (use case) | Couche | Raison d'extraction | Type de doublure | Squelette marchant | Priorité |
|---|---|---|---|---|---|---|
| AC1 — seuil non atteint | `CalculDuPanier.Chiffrer` | Application | — | aucune (calcul pur) | A | P1 |
| AC2 — seuil atteint | `CalculDuPanier.Chiffrer` | Application | — | aucune (calcul pur) | A | P1 |
| AC3 — palier le plus avantageux retenu | `CalculDuPanier.Chiffrer` | Application | — | aucune (calcul pur) | A | P2 |
| AC4 — remise par ligne, pas par panier | `CalculDuPanier.Chiffrer` | Application | — | aucune (calcul pur) | A | P2 |
| AC5 — grille vide | `CalculDuPanier.Chiffrer` | Application | — | aucune (calcul pur) | A | P1 |

## Mandat 4 — extraction de test de domaine (gated)

Candidat examiné : `GrilleDePaliers.PalierApplicable(Quantite)`.

- `B(P)` (branches) : grille vide → `null` ; quantité sous tout seuil → `null` ; un seul seuil
  atteint → son taux ; plusieurs seuils atteints → le taux maximal parmi eux.
- `A(P)` (branches atteintes par les AC planifiés) : AC5 atteint « grille vide » ; AC1 atteint
  « quantité sous tout seuil » ; AC2 atteint « un seul seuil atteint » ; AC3 atteint « plusieurs
  seuils atteints, taux maximal retenu ».
- `A(P) == B(P)` et taille combinatoire très réduite (4 cas) — très en dessous du seuil de 10–15.

**Verdict : `M4 negative — saturated by AC`.** Aucun test de domaine dédié à
`GrilleDePaliers.PalierApplicable` n'est créé : les 5 AC couvrent déjà toutes les branches.

## Tests déjà verts (à requalifier)

Avec le bouchon minimal posé en DISTILL (`GrilleDePaliers.PalierApplicable` retourne toujours
`null`, qu'importe la grille — voir `impl-plan.md`), certains tests passent dès l'écriture sans
qu'aucune logique métier n'ait été implémentée : la coïncidence vient de ce que « aucun palier
retenu » produit la même remise nulle attendue par ces critères.

- @ac-1 : role: regression — justification : avec 9 articles, le seuil de 10 n'est de toute façon
  jamais atteint ; le bouchon qui ne retient jamais de palier donne la même remise (0,00 €) que
  l'implémentation réelle attendrait pour ce cas précis. Le test reste nécessaire pour verrouiller
  le non-déclenchement sous le seuil une fois la vraie sélection de palier implémentée.
- @ac-4 : role: regression — justification : les deux lignes de 6 articles restent sous le seuil
  de 10 quel que soit le palier réellement sélectionné ; le bouchon (jamais de palier retenu) donne
  déjà 0,00 € par coïncidence. Le test reste la seule preuve que la remise est bien calculée ligne
  par ligne (pas de fusion des quantités 6 + 6 = 12, qui franchirait le seuil).
- @ac-5 : role: regression — justification : `GrilleDePaliers.Vide` ne contient aucun palier ; le
  bouchon renvoie déjà toujours `null` pour n'importe quelle grille, donc ce cas particulier est
  vrai par construction même avant toute implémentation réelle de la sélection de palier.

@ac-2 et @ac-3 restent rouges avec le bouchon : ils exigent une remise non nulle que le bouchon
(toujours `null`) ne peut pas produire — ce sont les deux tests qui pilotent l'implémentation réelle
de `GrilleDePaliers.PalierApplicable`.
