# language: fr
@bdd @panier @US-2
Fonctionnalité: Remise par palier de quantité
  En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
  référence en nombre, afin d'être encouragé à commander davantage d'un coup.

  @ac-1 @edge-case
  Scénario: AC-1 Une ligne sous le palier n'obtient aucune remise
    Soit un panier vide
    Et le palier « 10 articles ou plus : 5 % »
    Et une ligne de 9 articles à 2,00 €
    Quand le client chiffre son panier
    Alors la remise est de 0,00 €

  @ac-2 @happy-path
  Scénario: AC-2 Une ligne qui atteint le palier obtient la remise
    Soit un panier vide
    Et le palier « 10 articles ou plus : 5 % »
    Et une ligne de 10 articles à 2,00 €
    Quand le client chiffre son panier
    Alors la remise est de 1,00 €

  @ac-3 @edge-case
  Scénario: AC-3 Un seul palier s'applique, le plus avantageux
    Soit un panier vide
    Et le palier « 10 : 5 % »
    Et le palier « 50 : 12 % »
    Et une ligne de 50 articles à 2,00 €
    Quand le client chiffre son panier
    Alors la remise est de 12,00 €

  @ac-4 @edge-case
  Scénario: AC-4 La remise se calcule par ligne, jamais sur le panier entier
    Soit un panier vide
    Et le palier « 10 articles ou plus : 5 % »
    Et une ligne de 6 articles de référence "A"
    Et une ligne de 6 articles de référence "B"
    Quand le client chiffre son panier
    Alors la remise est de 0,00 €

  @ac-5 @edge-case
  Scénario: AC-5 Sans palier configuré, aucune remise
    Soit un panier vide
    Et aucun palier configuré
    Et une ligne quelconque
    Quand le client chiffre son panier
    Alors la remise est de 0,00 €
