# language: fr
@remise-quantite @validation-paliers
Fonctionnalité: Paliers autorisés pour le chiffrage
  Les règles de validation sont celles confirmées par le client en DESIGN.

  @ac-2 @edge-case
  Plan du scénario: Le client utilise les taux limites autorisés dès le premier article
    # Critère 2 : palier « 10 articles ou plus : 5 % »,
    # ligne de 10 articles à 2,00 € : remise 1,00 €.
    # Complément confirmé : seuil positif ; autoriser 0 % et 100 %.
    Soit le palier « 1 article ou plus : <taux> % »
    Et une ligne de 1 article à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors la remise est de <remise> €
    Et le montant à payer est de <à payer> €

    Exemples:
      | taux | remise | à payer |
      | 0    | 0,00   | 2,00    |
      | 100  | 2,00   | 0,00    |

  @ac-3 @error-case
  Plan du scénario: Le client ne peut pas chiffrer avec un seuil nul ou négatif
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Et un palier supplémentaire de seuil <seuil> à 5 %
    Et une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors le seuil invalide est explicitement rejeté
    Et aucune facture n'est rendue, même avec une remise de 12,00 €

    Exemples:
      | seuil |
      | 0     |
      | -1    |

  @ac-3 @error-case
  Plan du scénario: Le client ne peut pas chiffrer avec un taux hors des bornes
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Et un palier supplémentaire de seuil 1 à <taux> %
    Et une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors le taux hors [0,100] % est explicitement rejeté
    Et aucune facture n'est rendue, même avec une remise de 12,00 €

    Exemples:
      | taux |
      | -1   |
      | 101  |

  @ac-3 @error-case
  Plan du scénario: Le client ne peut pas chiffrer avec deux fois le même seuil
    Soit les paliers « 10 : 5 % » et « 50 : 12 % »
    Et un palier supplémentaire de seuil 10 à <taux> %
    Et une ligne de 50 articles à 2,00 €
    Quand le client demande le chiffrage du panier
    Alors le seuil dupliqué est explicitement rejeté
    Et aucune facture n'est rendue, même avec une remise de 12,00 €

    Exemples:
      | taux |
      | 5    |
      | 12   |
