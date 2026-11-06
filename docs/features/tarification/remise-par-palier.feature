# language: fr
@remise-par-palier @US-2
Fonctionnalité: Remise par palier de quantité
  En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
  référence en nombre, afin d'être encouragé à commander davantage d'un coup.

  @ac-2 @happy-path @smoke
  Scénario: Le client obtient la remise quand sa ligne atteint le palier
    Soit le palier "10 articles ou plus : 5 %"
    Et une ligne "MUG-01" de 10 articles à 2.00 euros
    Quand le client chiffre son panier
    Alors la remise est de 1.00 euros
    Et le montant à payer est de 19.00 euros

  @ac-3 @edge-case
  Scénario: Le client obtient seulement le palier le plus avantageux
    Soit le palier "10 articles ou plus : 5 %"
    Et le palier "50 articles ou plus : 12 %"
    Et une ligne "MUG-01" de 50 articles à 2.00 euros
    Quand le client chiffre son panier
    Alors la remise est de 12.00 euros
    Et le montant à payer est de 88.00 euros

  @ac-1 @edge-case
  Scénario: Le client n'obtient aucune remise sous le seuil du palier
    Soit le palier "10 articles ou plus : 5 %"
    Et une ligne "MUG-01" de 9 articles à 2.00 euros
    Quand le client chiffre son panier
    Alors la remise est de 0.00 euros
    Et le montant à payer est de 18.00 euros

  @ac-4 @edge-case
  Scénario: Le client n'obtient aucune remise quand ses références différentes n'atteignent pas le palier chacune
    Soit le palier "10 articles ou plus : 5 %"
    Et une ligne "MUG-01" de 6 articles à 2.00 euros
    Et une ligne "STY-07" de 6 articles à 2.00 euros
    Quand le client chiffre son panier
    Alors la remise est de 0.00 euros
    Et le montant à payer est de 24.00 euros

  @ac-5 @edge-case
  Scénario: Le client n'obtient aucune remise quand aucun palier n'est configuré
    Soit aucun palier de remise
    Et une ligne "MUG-01" de 10 articles à 2.00 euros
    Quand le client chiffre son panier
    Alors la remise est de 0.00 euros
    Et le montant à payer est de 20.00 euros
