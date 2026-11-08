# language: fr
@bdd @panier @US-2
Fonctionnalité: Remise par palier de quantité
  En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
  référence en nombre, afin d'être encouragé à commander davantage d'un coup.

  @ac-1 @edge-case
  Scénario: AC-1 Une ligne sous le palier n'obtient aucune remise
    Soit le palier « 10 articles ou plus : 5 % »
    Et une commande d'une ligne "MUG-01" de 9 articles à 2,00 €
    Quand le client chiffre sa commande
    Alors la remise est de 0,00 €

  @ac-2 @happy-path
  Scénario: AC-2 Une ligne qui atteint le palier obtient la remise
    Soit le palier « 10 articles ou plus : 5 % »
    Et une commande d'une ligne "MUG-01" de 10 articles à 2,00 €
    Quand le client chiffre sa commande
    Alors la remise est de 1,00 €

  @ac-3 @edge-case
  Scénario: AC-3 Un seul palier s'applique, le plus avantageux
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Et une commande d'une ligne "MUG-01" de 50 articles à 2,00 €
    Quand le client chiffre sa commande
    Alors la remise est de 12,00 €

  @ac-4 @edge-case
  Scénario: AC-4 La remise se calcule par ligne et non sur le panier entier
    Soit le palier « 10 articles ou plus : 5 % »
    Et une commande de deux lignes de 6 articles de références différentes
    Quand le client chiffre sa commande
    Alors la remise est de 0,00 €

  @ac-5 @edge-case
  Scénario: AC-5 Sans palier configuré, il n'y a aucune remise
    Soit aucun palier configuré
    Et une commande d'une ligne "MUG-01" de 50 articles à 2,00 €
    Quand le client chiffre sa commande
    Alors la remise est de 0,00 €
