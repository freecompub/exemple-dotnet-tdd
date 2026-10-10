# language: fr
@remise-quantite
Fonctionnalité: Remise par palier de quantité
  Les mêmes paliers s'appliquent à toutes les références.
  Chaque ligne bénéficie au plus d'un palier, le plus avantageux qu'elle atteint.

  @ac-2 @happy-path @smoke
  Scénario: Le client obtient la remise en atteignant le seuil
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et un panier contenant une ligne de 10 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 1,00 €

  @ac-3 @happy-path @smoke
  Scénario: Le client bénéficie du meilleur palier sans cumul
    Étant donné les paliers « 10 : 5 % » et « 50 : 12 % », dans cet ordre
    Et un panier contenant une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 12,00 €
    Et un seul palier s'applique, le plus avantageux

  @ac-4 @happy-path @smoke
  Scénario: Le client reçoit la somme des remises de chaque ligne éligible
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et deux références différentes dont les lignes de 6 articles ne déclenchent pas le palier de 10
    Et un panier contenant désormais pour chacune de ces références une ligne de 10 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise totale est de 2,00 €

  @ac-1 @edge-case
  Scénario: Le client ne reçoit pas de remise sous le seuil
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et un panier contenant une ligne de 9 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 0,00 €

  @ac-3 @edge-case
  Scénario: Le meilleur palier ne dépend pas de l'ordre de présentation
    Étant donné les paliers « 50 : 12 % » et « 10 : 5 % », dans cet ordre
    Et un panier contenant une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 12,00 €
    Et un seul palier s'applique, le plus avantageux

  @ac-3 @edge-case
  Scénario: Le meilleur palier n'est pas nécessairement celui du plus grand seuil
    Étant donné les paliers « 10 : 5 % » et « 50 : 12 % »
    Mais les taux de ces deux paliers sont échangés, donnant « 10 : 12 % » et « 50 : 5 % »
    Et un panier contenant une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 12,00 €
    Et un seul palier s'applique, le plus avantageux

  @ac-4 @edge-case
  Scénario: Les quantités de références différentes ne se cumulent pas
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et un panier contenant deux lignes de 6 articles de références différentes à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors les deux lignes ne déclenchent pas le palier de 10
    Et la remise est de 0,00 €

  @ac-5 @edge-case
  Scénario: Le client ne reçoit pas de remise sans palier configuré
    Étant donné aucun palier configuré
    Et un panier contenant une ligne de 10 articles à 2,00 €
    Quand le client demande le chiffrage de son panier
    Alors la remise est de 0,00 €
