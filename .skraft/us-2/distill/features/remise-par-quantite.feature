# language: fr
@remise-par-quantite
Fonctionnalité: Remise automatique par palier de quantité
  Les paliers sont communs à toutes les références.
  La remise reste calculée séparément pour chaque ligne.

  @ac-2 @happy-path @smoke
  Scénario: Le client atteint le seuil de remise
    Soit le palier « 10 articles ou plus : 5 % »
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 1,00 €
    Et le montant à payer est de 19,00 € pour une somme brute de 20,00 €

  @ac-3 @happy-path @smoke
  Scénario: Le client bénéficie du seul palier le plus avantageux
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Et une ligne de 50 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 12,00 €, sans addition des paliers
    Et le montant à payer est de 88,00 € pour une somme brute de 100,00 €

  @ac-1 @edge-case
  Scénario: Le client reste juste en dessous du seuil
    Soit le palier « 10 articles ou plus : 5 % »
    Et une ligne de 9 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 0,00 €
    Et le montant à payer est de 18,00 € pour une somme brute de 18,00 €

  @ac-4 @edge-case
  Scénario: Le client ne cumule pas les quantités de références différentes
    Soit le palier « 10 articles ou plus : 5 % »
    Et deux lignes de 6 articles à 2,00 € de références différentes
    Quand le client fait chiffrer son panier
    Alors aucune ligne ne déclenche le palier de 10
    Et la remise est de 0,00 €
    Et le montant à payer est de 24,00 € pour une somme brute de 24,00 €

  @ac-5 @edge-case
  Scénario: Le client ne reçoit pas de remise avec une grille vide
    Soit une grille sans aucun palier configuré
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier avec cette grille
    Alors la remise est de 0,00 €
    Et le montant à payer est de 20,00 € pour une somme brute de 20,00 €

  @ac-5 @edge-case
  Scénario: Le client conserve le chiffrage sans configuration de paliers
    Soit aucun palier configuré
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier sans fournir de grille
    Alors la remise est de 0,00 €
    Et le montant à payer est de 20,00 € pour une somme brute de 20,00 €
