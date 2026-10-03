# language: fr
Fonctionnalité: Remise par palier de quantité
  En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
  référence en nombre, afin d'être encouragé à commander davantage d'un coup.

  @ac-1
  Scénario: Palier « 10 articles ou plus : 5 % » non atteint par une ligne de 9 articles
    Soit le palier « 10 articles ou plus : 5 % »
    Quand une ligne de 9 articles à 2,00 € est chiffrée
    Alors la remise est de 0,00 €

  @ac-2
  Scénario: Palier « 10 articles ou plus : 5 % » atteint par une ligne de 10 articles
    Soit le palier « 10 articles ou plus : 5 % »
    Quand une ligne de 10 articles à 2,00 € est chiffrée
    Alors la remise est de 1,00 €

  @ac-3
  Scénario: Un seul palier, le plus avantageux, s'applique parmi plusieurs paliers atteints
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Quand une ligne de 50 articles à 2,00 € est chiffrée
    Alors la remise est de 12,00 €
    Et un seul palier s'applique, le plus avantageux

  @ac-4
  Scénario: La remise se calcule par ligne, jamais sur le panier entier
    Soit le palier « 10 articles ou plus : 5 % »
    Quand deux lignes de 6 articles de références différentes sont chiffrées
    Alors aucune des deux lignes ne déclenche le palier de 10
    Et la remise du panier est de 0,00 €

  @ac-5
  Scénario: Aucun palier configuré ne produit aucune remise
    Soit aucun palier configuré
    Quand une ligne est chiffrée
    Alors la remise est de 0,00 €
