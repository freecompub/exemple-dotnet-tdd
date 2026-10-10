# Revue DELIVER, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.3 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.25 |

## Lentille cold-reader : APPROVED

Aucun défaut.

- arbitrage sur `cold-reader#1.1` : **accepted** — Correction constatée : GrilleDePaliers copie la collection et expose une vue non modifiable, rejette les seuils dupliqués et les éléments nuls. Les seuils et taux sont validés par PalierDeQuantite, dont les propriétés sont en lecture seule ; la grille n’a donc pas besoin de répéter ces validations.
- arbitrage sur `cold-reader#1.2` : **accepted** — Correction constatée : TauxDeRemise rejette les valeurs hors ]0, 100] à la construction. Montant.Multiplie revalide également la valeur reçue, ce qui couvre le taux nul créé par défaut pour ce record struct. Le calcul ne peut plus accepter un taux invalide.

## Lentille test-integrity : APPROVED

Aucun défaut.

- arbitrage sur `test-integrity#1.1` : **accepted** — Corrigé : ConfigurationDePaliersTests vérifie les taux -1, 0 et 101 rejetés, 100 accepté, les valeurs par défaut de Quantite et TauxDeRemise rejetées par PalierDeQuantite, et les seuils dupliqués rejetés par GrilleDePaliers. Les seuils nuls et négatifs sont déjà couverts par les tests existants de Quantite. Les assertions portent sur les vrais constructeurs, désormais validants.
- arbitrage sur `test-integrity#1.2` : **accepted** — Corrigé : le test chiffre une remise initiale de 1,00 €, remplace le palier dans la collection source par un taux de 12 %, puis exige une facture inchangée. Il détecterait la conservation directe de la collection. GrilleDePaliers réalise une copie et l'expose via Array.AsReadOnly.
- arbitrage sur `test-integrity#1.3` : **accepted** — Corrigé : la théorie utilise 10 : 12 % et 50 : 5 % dans les deux ordres et exige une remise de 12,00 € ainsi qu'un montant à payer de 88,00 €. Elle distingue le maximum des sélections par plus grand seuil, premier ou dernier palier atteint, sans modifier les acceptances gelées.

## Lentille architecture : APPROVED

Aucun défaut.

- arbitrage sur `architecture#1.1` : **accepted** — Correction constatée : TauxDeRemise rejette les valeurs hors ]0,100], PalierDeQuantite revalide le seuil et le taux, y compris leurs valeurs par défaut, et GrilleDePaliers rejette les seuils dupliqués avant de devenir utilisable. Les invariants sont portés par le domaine.
- arbitrage sur `architecture#1.2` : **accepted** — Correction constatée : GrilleDePaliers copie la collection reçue avec ToArray puis expose Array.AsReadOnly(copie). Les paliers ont des propriétés en lecture seule ; aucune mutation de la collection d'origine ne peut modifier la configuration construite.

## Lentille quality-gates : APPROVED

Aucun défaut.

