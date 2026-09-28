# ADR-001 — Découpage domaine / application

- Statut : Accepted
- Date : 2026-09-28

## Contexte

Le calcul de dose porte des règles médicales : plafonds, arrondis, cumuls. Ces règles doivent
pouvoir être lues, testées et discutées avec un médecin sans qu'aucune question technique ne
s'interpose. Elles doivent aussi survivre au remplacement de l'interface ou du stockage.

## Décision

Deux couches, et une seule direction de dépendance.

`Dosage.Domaine` ne dépend de rien : ni paquet tiers, ni infrastructure, ni interface. Il porte les
types-valeurs (`Unite`) et les règles (`Plafond`).

`Dosage.Application` dépend du domaine et de lui seul. Il porte les cas d'usage (`CalculDeBolus`),
qui sont les points d'entrée que les tests d'acceptance pilotent.

## Conséquences

Une règle métier ne peut pas être écrite ailleurs que dans le domaine sans que la dépendance
devienne visible dans le `.csproj` — donc sans qu'une revue la voie.

En contrepartie, une règle qui a besoin d'un service extérieur (une horloge, un dépôt) ne peut pas
l'appeler directement : il faut la lui passer. C'est voulu, et c'est ce qui rend les règles
testables sans montage.

## Alternatives

*Un seul projet.* Plus simple à démarrer, mais rien n'empêche alors une règle médicale d'appeler
une base de données, et la frontière ne tient plus qu'à la discipline de chacun.

*Une couche infrastructure dès maintenant.* Prématuré : ce projet n'a encore ni stockage ni
interface. La couche sera ajoutée quand un besoin réel la réclamera.
