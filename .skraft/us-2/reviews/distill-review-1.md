# Revue DISTILL, essai 1

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) Les étapes « Soit » n'emploient pas le même vocabulaire d'un scénario à l'autre pour désigner la même notion : ac-1/ac-2 parlent du « palier » (« Soit le palier « 10 articles ou plus : 5 % » »), ac-3 parle des « paliers » dans une notation abrégée (« Soit les paliers « 10 : 5 % » et « 50 : 12 % » », sans répéter « articles ou plus »), et ac-5 introduit sans transition le terme « grille de remise » (« Soit une grille de remise sans aucun palier »). Un lecteur métier qui découvre le fichier doit déduire lui-même que « palier(s) » et « grille de remise » désignent la même famille de concept (un ensemble de seuils), ce qui n'est explicité nulle part dans le .feature. (.skraft/us-2/distill/features/remise-par-palier-de-quantite.feature)
- `cold-reader#1.2` **minor** (deliverable) L'étape de ac-3 (« Soit les paliers « 10 : 5 % » et « 50 : 12 % » ») abandonne la formulation complète « X articles ou plus » utilisée dans ac-1 et ac-2, pour une notation purement numérique « 10 : 5 % ». Une personne du métier qui ne lit que ce scénario isolément doit reconstituer le sens de « 10 » (un seuil de quantité) et de « 5 % » (un taux) par analogie avec les scénarios précédents plutôt que par le texte du scénario lui-même. (.skraft/us-2/distill/features/remise-par-palier-de-quantite.feature)
- `cold-reader#1.3` **minor** (code) Le nom de la méthode `Montant.Pourcentage(decimal taux)` ne dit pas, à la seule lecture de la signature, qu'elle retourne la part du montant correspondant à ce taux (un montant réduit) ; le mot « Pourcentage » seul pourrait tout aussi bien désigner le taux lui-même exprimé en pourcentage. Un nom tel que `Part(taux)` refléterait plus directement le vocabulaire métier de la remise (« la part du prix retenue par le taux »). (src/Tarification.Domaine/Montant.cs)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

