# US-2 — Plan d'implémentation

## Contrat et état de la phase DISTILL

La frontière reste `CalculDuPanier.Chiffrer`. Le contrat de DESIGN reçoit un `Panier` et des
`PaliersDeQuantite` communs à toutes les références. L'appel existant sans paliers reste disponible.
La facture expose la somme brute, la remise et le montant payable.

Cette phase n'implémente aucune règle métier. Elle ajoute uniquement les signatures d'entrée :
`PalierDeQuantite(int Seuil, decimal Pourcentage)`, `PaliersDeQuantite(params PalierDeQuantite[] Paliers)`
et `Chiffrer(Panier panier, PaliersDeQuantite paliers)`. La surcharge est bouchonnée par l'appel
existant à remise nulle, pour compiler et obtenir un rouge d'assertion métier. Les données de palier
sont conservées ; aucun validateur ou exception de remplacement n'est ajouté.

## Ordre de réalisation pour la boucle suivante

1. Partir du rouge du critère 2 : faire évaluer par le domaine les paliers atteints pour une ligne,
   avec seuil inclusif et calcul `sous-total brut × pourcentage / 100` en `decimal`.
   Raccorder ce calcul au vrai chiffrage ; ne pas laisser la surcharge déléguer au bouchon.
2. Faire passer le critère 3 : retenir une seule remise, la plus élevée parmi les candidats
   applicables, jamais la somme des paliers, ni le plus grand seuil par hypothèse.
   Faire passer aussi les deux exemples de la variante avec le palier `5 : 15 %` :
   le seuil inférieur doit gagner quel que soit l'ordre des trois paliers fournis.
3. Faire calculer chaque ligne avec le même ensemble de paliers ; additionner ses remises dans
   le panier, jamais ses quantités. Préserver les critères 1, 4 et 5 et l'ensemble vide.
4. Raccorder `Facture.ATPayer` : somme brute moins remise plus frais de port, selon DESIGN.
   Préserver `SommeDesArticles` brute et le port nul. Les assertions des critères 2 et 3
   vérifient déjà les montants nets 19,00 € et 88,00 €.
5. Préserver l'appel sans paliers et les cinq tests existants ; supprimer le caractère provisoire
   du bouchon lorsque le calcul réel est raccordé. Exécuter la suite via `run_tests`.

La responsabilité commerciale appartient au domaine (ADR-001) ; l'application orchestre et
retourne la facture. Les acceptances ne testent aucune politique isolée.

## Périmètre exclu

Aucun dépôt, service externe, stockage, administration des paliers, événement publié,
regroupement de lignes, promotion ou port nouveau. Aucun arrondi intermédiaire. Les politiques
générales d'arrondi et de cumul sont réservées aux stories suivantes comme indiqué par DESIGN.
Ne pas inventer de bornes de taux ou de rejet des doublons.

M4 negative — saturated by AC : pas de test de domaine par défaut. Un éventuel test interne
nécessite une branche inaccessible par les acceptances ou une vraie économie combinatoire,
explicitement justifiée lors de la boucle interne.
