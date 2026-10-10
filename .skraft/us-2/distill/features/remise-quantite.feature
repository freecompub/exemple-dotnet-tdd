# language: fr
@remise-quantite
Fonctionnalité: Remise par palier de quantité
  Le client bénéficie du palier le plus avantageux pour chaque ligne.
  Les mêmes paliers sont proposés pour toutes les références.

  @ac-2 @happy-path @smoke
  Scénario: Le client atteint le seuil et paie le montant remisé
    Soit le palier « 10 articles ou plus : 5 % »
    Et une ligne de 10 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise est de 1,00 €
    Et la somme des articles reste de 20,00 €
    Et le montant à payer est de 19,00 €

  @ac-3 @happy-path @smoke
  Plan du scénario: Le client bénéficie d'un seul palier quel que soit leur ordre
    Soit les paliers « 10 : 5 % » et « 50 : 12 % », proposés dans l'ordre <ordre>
    Et une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise est de 12,00 €
    Et un seul palier s'applique, le plus avantageux
    Et la somme des articles reste de 100,00 €
    Et le montant à payer est de 88,00 €

    Exemples:
      | ordre                |
      | seuils croissants    |
      | seuils décroissants  |

  @ac-4 @happy-path
  Scénario: Le client cumule les remises de deux lignes éligibles de références différentes
    Soit le palier « 10 articles ou plus : 5 % »
    Et deux lignes de références différentes de 10 articles chacune à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise totale est de 2,00 €
    Et le montant à payer est de 38,00 €
    # Critère 4 : deux lignes de 6 articles de références différentes
    # ne déclenchent pas le palier de 10 ; les remises restent calculées par ligne.

  @ac-1 @edge-case
  Scénario: Le client reste sous le seuil
    Soit le palier « 10 articles ou plus : 5 % »
    Et une ligne de 9 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise est de 0,00 €
    Et le montant à payer est de 18,00 €

  @ac-3 @edge-case
  Scénario: Le client bénéficie du taux supérieur plutôt que du seuil supérieur
    # Critère 3 : paliers « 10 : 5 % » et « 50 : 12 % »,
    # ligne de 50 articles à 2,00 € : remise 12,00 €.
    # Variante de la même règle : un seul palier s'applique, le plus avantageux.
    Soit les paliers « 10 : 12 % » et « 50 : 5 % »
    Et une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise est de 12,00 €
    Et le montant à payer est de 88,00 €

  @ac-4 @edge-case @smoke
  Scénario: Le client ne cumule pas les quantités de références différentes
    Soit le palier « 10 articles ou plus : 5 % »
    Et deux lignes de 6 articles de références différentes à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors les deux lignes ne déclenchent pas le palier de 10
    Et la remise est de 0,00 €
    Et le montant à payer est de 24,00 €

  @ac-5 @edge-case
  Plan du scénario: Le client ne bénéficie d'aucune remise sans palier configuré
    Soit une ligne de 10 articles à 2,00 €
    Et aucun palier configuré, avec un barème <barème>
    Quand le client demande le chiffrage du panier
    Alors la remise est de 0,00 €
    Et le montant à payer est de 20,00 €

    Exemples:
      | barème           |
      | vide fourni      |
      | non fourni       |

  @ac-5 @edge-case
  Plan du scénario: Le client obtient une facture nulle pour un panier vide
    Soit un panier sans articles
    Et un barème <barème>
    Quand le client demande le chiffrage du panier
    Alors la somme des articles est de 0,00 €
    Et la remise est de 0,00 €
    Et le montant à payer est de 0,00 €

    Exemples:
      | barème                                      |
      | sans palier configuré                       |
      | avec le palier « 10 articles ou plus : 5 % » |
