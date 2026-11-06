# Revue DELIVER, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (code) Le nom `Fraction` ne dit pas que le paramètre est en pour-cent (seul le résumé XML le précise), et `MeilleurTauPour` renvoie un `decimal` nu alors que `Taux` existe comme type. Un nom comme `AuTaux` ou un paramètre typé `Taux` rendrait l'intention lisible à l'appel. (src/Tarification.Domaine/Montant.cs:24) — gravité : Gêne de lecture à l'appel, sans effet sur le comportement. — aussi : src/Tarification.Domaine/GrilleDeRemise.cs:20
- `cold-reader#2.2` **minor** (code) La règle « le meilleur taux parmi les paliers atteints » (pas de cumul, seuil inclus, pas d'arrondi du résultat) n'est écrite nulle part. Le lecteur doit la déduire du `Where`/`Max` ; un résumé XML sur `RemisePour` l'expliciterait. (src/Tarification.Domaine/GrilleDeRemise.cs:14) — gravité : Règle métier implicite, mais déductible du code en quelques lignes.

## Lentille test-integrity : APPROVED

Aucun défaut.

- note (hors du changement) : `test-integrity#2.1` **minor** Aucun test n'a deux lignes qui obtiennent chacune une remise non nulle. Un mutant qui ne garderait que la remise d'une seule ligne, au lieu de les additionner dans RemisePour(Panier), survivrait : ac-4 attend 0 des deux côtés. Les autres mutants de GrilleDeRemise (seuil ≤, Max, calcul par ligne) sont tués par ac-1, ac-2, ac-3 et ac-4. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:50)

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

- `quality-gates#2.1` **minor** (test) La garde ajoutée à Montant.Fraction (taux négatif -> exception) n'est couverte par aucun test : ni acceptance (les cinq scénarios ac-1 à ac-5 ne passent jamais un taux négatif), ni unitaire (aucun test ne référence Fraction, cf. recherche dans tests/). La couverture de ligne à 100 % ne prouve pas la branche throw, puisque la garde tient sur la même ligne que le calcul. Un test unitaire Fraction négatif doit lever ArgumentOutOfRangeException. (src/Tarification.Domaine/Montant.cs:25) — gravité : Le défaut signalé précédemment est corrigé dans le code, mais le comportement de la garde n'est vérifié par aucun test : une régression passerait inaperçue, sans que le sujet bloque le scénario métier.
- arbitrage sur `quality-gates#1.1` : **accepted** — Corrigé : Montant.Fraction lève ArgumentOutOfRangeException pour un taux négatif (src/Tarification.Domaine/Montant.cs:25), comme De et Multiplie. La garde est présente dans le livrable. Reste une lacune de test, signalée ci-dessous.
- note (hors du changement) : `quality-gates#2.2` **minor** Les cas de contrat notés dans le plan de test pour la boucle interne (« Pourcentage.De hors [0 ; 100] et PalierDeQuantite à seuil < 1 lèvent ArgumentOutOfRangeException ») ne sont écrits nulle part : aucun test unitaire n'a été ajouté (faits : « aucun »). Le plan les signale comme « non écrits », donc l'écart est connu et déclaré, mais il reste une garantie de contrat non mesurée. (.skraft/us-2/distill/test-plan.md:16)
