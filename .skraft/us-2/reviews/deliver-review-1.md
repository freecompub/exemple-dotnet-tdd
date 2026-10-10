# Revue DELIVER, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : CHANGES_REQUESTED

- `cold-reader#1.1` **major** (code) La grille n’applique aucune validation ni copie défensive : le constructeur accepte une liste arbitraire, sans vérifier seuil >= 1, taux dans ]0 %, 100 %], ni unicité des seuils. Le design exige un objet valeur immuable, rejet explicite à la construction et collection non modifiable. Une mutation externe de la liste après construction continue d’affecter la grille, ce qui viole le contrat. (src/Tarification.Domaine/GrilleDePaliers.cs:3)
- `cold-reader#1.2` **major** (code) Le calcul de remise via `Multiplie(TauxDeRemise)` ne garantit pas le contrat métier du taux : le design impose un pourcentage strictement > 0 et <= 100, avec rejet explicite quand la configuration est invalide. Ici toute valeur de `TauxDeRemise` est acceptée sans validation, ce qui permet des remises arbitraires et casse le contrat d’intégrité de la grille. (src/Tarification.Domaine/Montant.cs:18)

## Lentille test-integrity : CHANGES_REQUESTED

- `test-integrity#1.1` **major** (test) Aucun test ne vérifie les rejets de configuration pourtant clarifiés et prévus pour la boucle interne : seuil invalide, taux hors ]0,100], seuils dupliqués. Les acceptances ne construisent que des configurations valides ; la fabrique appelle même Quantite.De avant PalierDeQuantite, empêchant d'éprouver le seuil par défaut. Les types provisoires sans validation passent donc toute la suite. Ajouter des tests de construction avec assertions sur les exceptions attendues, incluant default(Quantite), et l'acceptation de 100 %. Ce comportement n'est couvert par aucune acceptance existante. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:93)
- `test-integrity#1.2` **major** (test) L'immuabilité de la grille, obligation du DESIGN et du plan de réalisation, n'est éprouvée par aucun test. Chaque acceptance fournit un tableau qui n'est jamais modifié ensuite : conserver directement cette collection mutable, comme le fait actuellement GrilleDePaliers, reste indétectable. Ajouter un test qui construit la grille depuis une collection mutable, chiffre une ligne éligible, modifie la collection source puis exige le même résultat. Il ne duplique aucun comportement actuellement vérifié par acceptance. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:93)
- `test-integrity#1.3` **major** (test) Le seul cas à plusieurs paliers place le taux maximal au dernier et au plus grand seuil. Il ne distingue pas le maximum promis d'une sélection du dernier palier atteint ou du plus grand seuil : ces remplacements laisseraient toutes les acceptances vertes. La matrice DESIGN exigeait précisément 10 : 12 % et 50 : 5 %, dans les deux ordres, pour une ligne de 50 × 2,00 € avec remise 12,00 €. Ajouter cette vérification complémentaire sans modifier les acceptances gelées ; aucune acceptance existante ne couvre cette distinction. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:38)

## Lentille architecture : CHANGES_REQUESTED

- `architecture#1.1` **major** (code) Les invariants de configuration ratifiés ne sont pas appliqués dans le domaine : TauxDeRemise accepte tout decimal, PalierDeQuantite accepte un Quantite par défaut de valeur 0, et GrilleDePaliers accepte des seuils dupliqués. Ces signatures provisoires de DISTILL subsistent dans la livraison. Un taux nul devient silencieusement une remise nulle ; un taux supérieur à 100 peut produire une remise supérieure au sous-total, puis un rejet tardif lors du calcul de ATPayer. Appliquer le rejet explicite à la construction prévu par design/contracts.md:15-19 et research/clarification.md:15, avant qu'une configuration soit utilisable. (src/Tarification.Domaine/TauxDeRemise.cs:4)
- `architecture#1.2` **major** (code) GrilleDePaliers conserve et expose directement la collection reçue. IReadOnlyList n'empêche pas la mutation de la List sous-jacente par l'appelant : modifier cette liste après construction change les remises calculées avec la même grille. Cela contredit l'objet-valeur composite immuable retenu en DESIGN et la copie non modifiable exigée par design/contracts.md:17. Prendre une copie défensive et ne pas exposer de collection modifiable afin que la configuration validée reste stable. (src/Tarification.Domaine/GrilleDePaliers.cs:3)

## Lentille quality-gates : APPROVED

Aucun défaut.

