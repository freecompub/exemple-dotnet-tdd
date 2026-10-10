# Plan d'implémentation — US-2

## Point de départ DISTILL

Huit tests d'acceptance entrent par `CalculDuPanier.Chiffrer` et observent `Facture.Remise`.
Deux supports de données provisoires (`PalierDeQuantite`, `ConfigurationDePaliers`)
et une surcharge délégant au calcul historique sont le strict bouchon de compilation.
Ils ne constituent pas une implémentation livrable : aucun calcul, aucune validation,
aucune garantie d'immuabilité n'y est réalisé. Les tests rouges métier guideront la suite.

## Boucle externe, puis boucle interne

1. Partir de `Ac2_Le_client_obtient_la_remise_en_atteignant_le_seuil` :
   transmettre la configuration commune au domaine, évaluer la quantité de chaque ligne,
   calculer sa remise sur son sous-total decimal et rendre la somme dans `Facture.Remise`.
   Garder les règles commerciales hors de l'application, conformément à ADR-001.
2. Faire passer les trois tests du critère 3 : parmi les paliers éligibles,
   retenir l'avantage maximal, sans cumul, sans dépendance à l'ordre ou au plus grand seuil.
   Conserver les verts de non-éligibilité, de séparation des lignes et de configuration vide.
   Faire passer également le test multi-ligne du critère 4 : chaque référence de
   10 articles à 2,00 € bénéficie du palier 10 / 5 %, puis les deux remises s'additionnent
   en 2,00 €. Ne pas limiter le calcul à la première ligne du panier.
3. Remplacer les supports provisoires par une représentation cohérente avec les bornes
   métier clarifiées : seuil entier >= 1, taux decimal entre 0 % et 100 % inclus,
   rejet explicite de toute configuration invalide. Examiner les propositions DESIGN
   de validation à construction et de collection immuable avant de les concrétiser.
   Ne pas ajouter d'administration, de dépôt ou de publication d'événements.
4. Préserver la construction des lignes, le calcul brut, l'appel historique sans configuration
   et les tests US-1. Examiner explicitement le raccordement de `ATPayer` et la compatibilité
   du résultat avant de modifier cette surface : le DESIGN ne tranche pas encore ce contrat.
5. Supprimer les commentaires de bouchon quand les signatures portent le comportement réel.
   Vérifier que les tests passent par l'entrée applicative effective et échoueraient si
   l'évaluation métier était retirée. Toute nouvelle branche interne non observable par les
   scénarios doit être justifiée avant d'extraire un test unitaire.

## Hors périmètre et questions différées

Pas de test unitaire par défaut : M4 negative — saturated by AC pour la sélection et le calcul
décrits par les huit scénarios. Les gardes techniques et les choix d'API de validation seront
traités dans la boucle interne, pas comme de nouveaux critères inventés.
Ne pas imposer d'arrondi au centime, de cumul promotionnel, de frais de port, de stock,
de fusion des références ou de détail public des remises par ligne.
Si un exemple futur nécessite une règle non tranchée, poser la question avant d'encoder
sa valeur attendue.

Les seules écritures de sources de cette phase sont les signatures et le bouchon ;
aucune règle de production n'est implémentée en DISTILL.
