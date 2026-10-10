# Revue DISTILL, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (deliverable) Les libellés « M4 negative — saturated by AC » et « A » dans la colonne Walking Skeleton restent indéfinis dans le plan. Le texte décrit la couverture et identifie les scénarios `@smoke`, mais ne donne pas la signification de ces étiquettes ; un lecteur extérieur ne peut donc pas interpréter complètement la convention de notation. (.skraft/us-2/distill/test-plan.md)
- arbitrage sur `cold-reader#1.1` : **accepted** — Le défaut est corrigé : le plan de scénario AC-3 introduit un palier au seuil 5 avec 15 %, supérieur aux remises aux seuils 10 et 50, et fournit deux ordres de configuration. Le plan de test et la théorie d'acceptance couvrent les deux permutations et attendent 15,00 € de remise et 85,00 € à payer ; cela distingue la maximisation de la remise du choix du plus grand seuil ou du premier/dernier palier.

## Lentille test-integrity : APPROVED

Aucun défaut.

- arbitrage sur `test-integrity#1.1` : **accepted** — Correction constatée : une théorie d'acceptance ajoute le palier 5 / 15 % aux paliers 10 / 5 % et 50 / 12 %, avec une ligne de 50 articles à 2,00 €, et vérifie une remise de 15,00 € et un montant payable de 85,00 € dans les deux ordres inversés. Ces assertions discriminent la maximisation du montant contre la sélection du plus grand seuil, du premier ou du dernier palier applicable, ainsi que contre le cumul. Le scénario Gherkin et les plans reflètent cette variante sans affaiblir le test original.

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

