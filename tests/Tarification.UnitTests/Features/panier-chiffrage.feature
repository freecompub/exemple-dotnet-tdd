# language: fr
@bdd @panier @US-1
Fonctionnalité: Chiffrer un panier ligne à ligne
  En tant que client, je veux connaître la somme des articles de mon panier.

  @ac-1 @happy-path
  Scénario: Le client chiffre une ligne de plusieurs articles
    Soit un panier vide
    Et une ligne "MUG-01" de 3 articles à 4.50 euros
    Quand le client chiffre son panier
    Alors la somme des articles est de 13.50 euros

  @ac-2 @happy-path
  Scénario: Le client chiffre plusieurs lignes
    Soit un panier vide
    Et une ligne "MUG-01" de 3 articles à 4.50 euros
    Et une ligne "STY-07" de 2 articles à 1.20 euros
    Quand le client chiffre son panier
    Alors la somme des articles est de 15.90 euros

  @ac-3 @edge-case
  Scénario: Le client chiffre un panier vide
    Soit un panier vide
    Quand le client chiffre son panier
    Alors la somme des articles est de 0.00 euros
