# Plan d'implémentation — US-2

Les étapes suivent les scénarios de `features/remise-quantite.feature`, de
l'extérieur vers l'intérieur. Les tests sont sociables au point d'entrée
Application, sans doublure, selon `test-plan.md` et la recherche acquise.
DISTILL ne livre que ces tests et les signatures minimales pour compiler.
Les fabriques provisoires et la surcharge qui ignore encore le barème sont
des bouchons à remplacer pendant DELIVER, pas une implémentation de la remise.

## Étape 1 — ac-2 — walking skeleton
- Test : `tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`
- Nom : `Ac2_Une_ligne_au_seuil_recoit_la_remise_deduite_du_total`
- Entre par : `CalculDuPanier.Chiffrer(Panier, BaremeDeRemise)`.
- Partir du rouge métier : 1,00 € attendu contre une remise actuelle de zéro.
- Alimenter `Facture.Remise` depuis `Panier.SommeDesRemises`, puis faire émerger
  `BaremeDeRemise.RemisePour`, les objets-valeurs et les opérations de `Montant`
  nécessaires. Garder le sous-total brut et déduire la remise dans `ATPayer`.
- Vérifier le net de 19,00 € ; ne pas mettre la règle commerciale dans l'application.

## Étape 2 — ac-3
- Test : `tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`
- Nom : `Ac3_Seul_le_palier_le_plus_avantageux_est_applique`
- Entre par : `CalculDuPanier.Chiffrer(Panier, BaremeDeRemise)`.
- Observer 12,00 € de remise et 88,00 € à payer. Depuis le cas d'usage,
  faire évoluer le barème vers le maximum des remises éligibles, sans cumul.
- Respecter les clarifications : doublons admis, pas de dépendance à l'ordre,
  pas d'hypothèse de taux croissants, taux de 0 % à 100 % inclus.

## Étape 3 — ac-1
- Test : `tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`
- Nom : `Ac1_Une_ligne_sous_le_seuil_ne_recoit_pas_de_remise`
- Entre par : `CalculDuPanier.Chiffrer(Panier, BaremeDeRemise)`.
- Préserver la régression : 9 articles à 2,00 €, remise 0,00 €.
- Vérifier depuis la facture que le seuil de 10 reste inclusif, sans calcul
  de remise sur les lignes qui ne l'atteignent pas.

## Étape 4 — ac-4
- Test : `tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`
- Nom : `Ac4_Deux_references_ne_cumulent_pas_leurs_quantites`
- Entre par : `CalculDuPanier.Chiffrer(Panier, BaremeDeRemise)`.
- Préserver la régression sur deux lignes de 6 articles de références
  différentes : aucune ne déclenche le palier de 10.
- Assurer l'évaluation ligne par ligne dans le panier puis la somme des
  remises, sans cumuler les quantités et sans modifier les sous-totaux bruts.

## Étape 5 — ac-5
- Test : `tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`
- Noms : `Ac5_Un_bareme_vide_ne_donne_aucune_remise`,
  `Ac5_L_appel_sans_bareme_ne_donne_aucune_remise`.
- Entre par : `CalculDuPanier.Chiffrer` avec barème vide puis sans barème.
- Préserver les deux régressions : remise 0,00 € sur un panier non vide.
- Faire converger les deux surcharges vers le même calcul avec un barème
  vide ; conserver les tests US-1 et les conventions des objets-valeurs.

## Contrôles transverses de DELIVER

Conserver les valeurs en `decimal`, sans nouvelle politique d'arrondi.
Ne pas ajouter de tests unitaires du domaine par défaut : appliquer M4 du
plan de test et réserver à la boucle interne les éventuelles gardes techniques.
Utiliser uniquement `run_tests` pour mesurer les résultats ; ni commande de
compilation séparée, ni commit, ni porte ou mutation exécutée manuellement.
