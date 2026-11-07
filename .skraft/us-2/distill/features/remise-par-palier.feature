#language: fr
Fonctionnalité: Remise par palier de quantité
  En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
  référence en nombre, afin d'être encouragé à commander davantage d'un coup.

  @ac-1
  Scénario: Une ligne sous le seuil n'obtient aucune remise
    Soit le palier « 10 articles ou plus : 5 % »
    Quand une ligne de 9 articles à 2,00 € est chiffrée
    Alors la remise est de 0,00 €

  @ac-2
  Scénario: Une ligne qui atteint le seuil obtient la remise du palier
    Soit le palier « 10 articles ou plus : 5 % »
    Quand une ligne de 10 articles à 2,00 € est chiffrée
    Alors la remise est de 1,00 €

  @ac-3
  Scénario: Un seul palier s'applique, le plus avantageux
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Quand une ligne de 50 articles à 2,00 € est chiffrée
    Alors la remise est de 12,00 €

  @ac-4
  Scénario: La remise se calcule par ligne, jamais sur le panier entier
    Soit le palier « 10 articles ou plus : 5 % »
    Quand deux lignes de 6 articles de références différentes sont chiffrées
    Alors la remise est de 0,00 €

  @ac-5
  Scénario: Sans palier configuré, aucune remise
    Soit aucun palier configuré
    Quand une ligne de 10 articles à 2,00 € est chiffrée
    Alors la remise est de 0,00 €
