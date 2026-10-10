# language: fr
@remise-quantite
Fonctionnalité: Remise automatique par palier de quantité
  En tant que client
  Je veux bénéficier d'une remise sur chaque référence commandée en nombre
  Afin d'être encouragé à commander davantage d'un coup

  @ac-2 @happy-path @smoke
  Scénario: Le client obtient une remise dès que sa ligne atteint le seuil
    Soit le palier commun « 10 articles ou plus : 5 % »
    Et un panier contenant une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise sur sa facture est de 1,00 €
    Et le montant à payer est de 19,00 €

  @ac-3 @happy-path @smoke
  Scénario: Le client bénéficie du seul palier le plus avantageux
    Soit les paliers communs « 10 : 5 % » et « 50 : 12 % »
    Et un panier contenant une ligne de 50 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise sur sa facture est de 12,00 €
    Et le montant à payer est de 88,00 €

  @ac-3 @edge-case
  Plan du scénario: Le client reçoit la meilleure remise même si son seuil est inférieur
    # Critère : « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €.
    # Variante discriminante : un palier supplémentaire plus avantageux est atteint.
    Soit les paliers communs <paliers>
    Et un panier contenant une ligne de 50 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise sur sa facture est de 15,00 €
    Et le montant à payer est de 85,00 €

    Exemples:
      | paliers                                         |
      | « 5 : 15 % », « 10 : 5 % » et « 50 : 12 % »       |
      | « 50 : 12 % », « 10 : 5 % » et « 5 : 15 % »       |

  @ac-1 @edge-case
  Scénario: Le client ne reçoit pas de remise sous le seuil
    Soit le palier commun « 10 articles ou plus : 5 % »
    Et un panier contenant une ligne de 9 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise sur sa facture est de 0,00 €

  @ac-4 @edge-case
  Scénario: Le client ne cumule pas les quantités de références différentes
    Soit le palier commun « 10 articles ou plus : 5 % »
    Et un panier contenant deux lignes de 6 articles à 2,00 € de références différentes
    Quand le client fait chiffrer son panier
    Alors aucune des deux lignes ne déclenche le palier de 10
    Et la remise sur sa facture est de 0,00 €

  @ac-5 @edge-case
  Scénario: Le client ne reçoit pas de remise sans palier configuré
    Soit aucun palier configuré
    Et un panier contenant une ligne de 10 articles à 2,00 €
    Quand le client fait chiffrer son panier
    Alors la remise sur sa facture est de 0,00 €
