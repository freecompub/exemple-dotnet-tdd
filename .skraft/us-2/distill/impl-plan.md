# Plan d'implémentation — US-2

## État laissé par DISTILL

L'acceptance appelle le vrai `CalculDuPanier.Chiffrer`, pas un calculateur de test.
Seules les signatures nécessaires à sa compilation sont ajoutées aux sources :
`TauxDeRemise(decimal Pourcentage)`, `PalierDeRemise(int Seuil, TauxDeRemise Taux)`,
`BaremeDeRemise(IReadOnlyList<PalierDeRemise> Paliers)` et la surcharge
`Chiffrer(Panier, BaremeDeRemise)`. Les records ne valident ni ne calculent.
La surcharge ignore temporairement le barème et délègue au chiffrage existant.
Elle est explicitement un bouchon de DISTILL, pas une politique de production.
`Facture.ATPayer` n'est pas modifié à cette phase.

Les signatures concrétisent les noms et données de DESIGN, dont les signatures
de code n'étaient pas imposées. Les futurs invariants devront s'appliquer à toutes
les constructions, y compris les possibilités exposées par les records.

## Boucle externe et ordre conseillé

1. Partir de `Ac2_Le_client_atteint_le_seuil_et_paie_le_montant_remise` :
   transmettre le barème au domaine ; remise de 1,00 € pour 10 articles à 2,00 €
   avec « 10 articles ou plus : 5 % » ; conserver la somme brute 20,00 € et déduire
   la remise pour obtenir 19,00 € à payer. Remplacer le bouchon, pas le test.
2. Faire passer la sélection d'un seul palier le plus avantageux :
   « 10 : 5 % » et « 50 : 12 % », 50 articles à 2,00 €, remise 12,00 €.
   Les deux ordres et la variante au taux maximal sur le seuil inférieur doivent
   utiliser la même règle, sans cumul, sans tri par seuil supposé suffisant.
3. Faire passer les deux lignes éligibles avec un barème commun : calcul local
   dans `LigneDePanier`, somme des remises dans `Panier`, aucune agrégation
   des quantités ni regroupement par référence.
4. Garantir les invariants de construction : seuil strictement positif, taux
   decimal dans [0,100] %, seuils distincts. Rejeter explicitement les invalides,
   ne jamais les convertir en absence de palier. Accepter seuil 1, 0 % et 100 %.
   À 100 %, remise égale à la somme brute et montant à payer nul.
5. Maintenir toutes les régressions : 9 articles sans remise, deux lignes de 6
   sans seuil atteint, barème vide, appel historique sans barème et panier vide.
   L'ancien appel doit déléguer au chemin commun avec barème vide une fois
   le nouveau chemin implémenté, sans deuxième algorithme.
6. Refactorer après vert sans déplacer les règles commerciales dans l'application.
   Vérifier tous les exemples via `run_tests` et conserver les tests US-1.

## Responsabilités à prolonger

`BaremeDeRemise` conserve une configuration immuable et choisit le taux maximal
parmi les seuils atteints. `LigneDePanier` calcule la remise sur tout son sous-total.
`Panier` additionne les remises locales. `Montant` encapsule pourcentage et
soustraction avec `decimal`, sans arrondi intermédiaire et sans clamp silencieux.
`CalculDuPanier` orchestre et rend `Facture` ; `SommeDesArticles` reste brute,
`Remise` devient la somme des remises, `FraisDePort` reste nul et `ATPayer`
déduit la remise avant d'ajouter les frais.

Pas de nouveau service, dépôt, événement publié, stockage ou couche technique.
Pas de code de calcul dans les builders de test. Les textes des assertions
monétaires et les exemples Gherkin restent le contrat extérieur.

## Boucle interne et hors périmètre

M4 negative — saturated by AC : ne pas créer de tests unitaires doublant les
branches métier déjà couvertes. Les protections purement techniques identifiées
dans `test-plan.md` pourront ouvrir `branch_unreachable_via_AC` seulement si
une branche réelle et non observable par l'acceptance le justifie.
DISTILL ne les implémente et ne les teste pas.

Ne pas anticiper les arrondis d'US-5, les promotions d'US-3, les frais de port
d'US-4 ou le catalogue d'US-6. Aucune commande, aucun commit ni porte de
l'orchestrateur n'est exécuté dans cette phase.
