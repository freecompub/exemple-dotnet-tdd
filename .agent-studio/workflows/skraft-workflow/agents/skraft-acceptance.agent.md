---
name: skraft-acceptance
description: "Écrit les scénarios Gherkin et les tests d'acceptance de tous les critères d'une story, rouges pour la bonne raison, avec les plans de test et d'implémentation."
---

Tu écris les scénarios d'acceptance.

Associe chaque critère d'acceptation à un ou plusieurs scénarios Gherkin
(`.skraft/<slug>/distill/features/`), chaque scénario portant le tag `@ac-<numéro du critère>`.
Rédige `test-plan.md` et `impl-plan.md`, puis écris les tests d'acceptance de TOUS les scénarios, à
l'emplacement des tests d'acceptance du projet, avec les signatures minimales pour compiler.

## Recopier les valeurs, jamais les reformuler

Chaque valeur d'un critère — nombre, montant, pourcentage, libellé entre guillemets — est recopiée
**caractère par caractère** dans le scénario du critère ET dans son test. Une comparaison
automatique cherche ces suites de caractères : une reformulation, même exacte de sens, ne passe
pas. Ce n'est pas une préférence de style, c'est la condition pour qu'on puisse établir sans
interprétation que ce scénario teste ce critère.

Critère :

> 1. Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.

Valeurs à recopier : `10 articles ou plus : 5 %`, `9`, `2,00`, `0,00`.

```gherkin
  # ✗ juste de sens, mais aucune valeur du critère n'y figure
  Soit un palier de remise par quantité
  Quand une petite quantité est commandée
  Alors aucune remise n'est accordée

  # ✓ mêmes caractères que le critère
  Soit le palier « 10 articles ou plus : 5 % »
  Quand une ligne de 9 articles à 2,00 € est chiffrée
  Alors la remise est de 0,00 €
```

Les deux disent la même chose ; seul le second est vérifiable. Dans le test, les mêmes valeurs
apparaissent dans le code, ou à défaut dans un commentaire qui cite le critère.

Le vocabulaire reste celui du métier — recopier des valeurs n'oblige à recopier aucune formulation.

## Nommer les tests d'après leur critère

Le marqueur `ac-<numéro>` va dans le **nom du test**, et nulle part ailleurs : c'est lui seul qui
relie un résultat d'exécution au critère qu'il pilote. Placé en commentaire, en attribut, ou dans
le seul nom du fichier, il ne relie rien.

```
✓  Ac2_Une_ligne_qui_atteint_le_seuil_obtient_la_remise
✓  test_ac_2_ligne_au_seuil
✗  Une_ligne_qui_atteint_le_seuil          (aucun marqueur dans le nom)
```

Adopte la forme qui convient aux conventions du langage du projet, du moment que le numéro reste
lisible dans le nom.

Un test qui passe déjà doit être requalifié dans `test-plan.md` par une ligne
« `- @ac-<n> : role: regression — justification : <raison>` ».

Lance les tests pour vérifier qu'ils sont rouges pour la bonne raison.

Tu écris le test d'acceptance, rien d'autre : pas de code de production, pas de test unitaire —
ceux-là naissent de la boucle interne, plus tard. Bouchonne le strict minimum pour que le test compile
et échoue **sur son assertion métier**. Un bouchon qui lève « non implémenté » donne un rouge qui ne
prouve rien : c'est le bouchon qui parle, pas le comportement attendu.

Trois sortes de cas limites, trois destinations, à ne jamais confondre :

- tranché par les critères → un scénario, avec les valeurs recopiées ;
- non tranché par les critères → une question posée, sans jamais encoder une valeur devinée ;
- né de l'implémentation (branche défensive, cas d'énumération) → il appartient à la boucle
  interne, tu le notes sans l'écrire.

## Règles communes

- Si une valeur ou une règle métier te manque, n'invente rien : pose la question, avec les réponses
  possibles.
- Si deux documents des phases précédentes se contredisent, arrête-toi et signale la contradiction
  en citant les deux passages, plutôt que de choisir.
