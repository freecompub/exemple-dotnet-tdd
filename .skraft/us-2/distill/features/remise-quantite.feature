# language: fr
@remise-quantite
Fonctionnalité: Remise par palier de quantité
  Les mêmes paliers s'appliquent à toutes les références,
  mais chaque ligne bénéficie indépendamment de sa remise.

  @ac-2 @happy-path @smoke
  Scénario: Le client obtient une remise au seuil exact
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 1,00 €
    Et le total à payer est de 19,00 €

  @ac-3 @happy-path
  Scénario: Le client bénéficie uniquement du palier le plus avantageux
    Étant donné les paliers « 10 : 5 % » et « 50 : 12 % »
    Et une ligne de 50 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 12,00 €
    Et le total à payer est de 88,00 €

  @ac-1 @edge-case
  Scénario: Le client ne bénéficie pas de remise sous le seuil
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et une ligne de 9 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 0,00 €

  @ac-4 @edge-case
  Scénario: Le client ne cumule pas les quantités de références différentes
    Étant donné le palier « 10 articles ou plus : 5 % »
    Et deux lignes de 6 articles de références différentes à 2,00 € l'article
    Quand le client fait chiffrer son panier
    Alors aucune ligne ne déclenche le palier de 10
    Et la remise est de 0,00 €

  @ac-5 @edge-case
  Scénario: Le client ne bénéficie pas de remise avec des paliers vides
    Étant donné aucun palier configuré
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise est de 0,00 €

  @ac-5 @edge-case
  Scénario: Le client conserve le chiffrage habituel sans fournir de paliers
    Étant donné aucun palier configuré
    Et une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier sans préciser de paliers
    Alors la remise est de 0,00 €
