# ADR-001 — Découpage domaine / application

- Statut : Accepted
- Date : 2026-09-28

## Contexte

La tarification porte des règles commerciales : paliers de remise, codes promotionnels, seuils de
gratuité, arrondis. Ces règles se discutent avec des gens du métier, changent souvent, et doivent
pouvoir être lues sans qu'aucune question technique ne s'interpose. Elles doivent aussi survivre au
remplacement de l'interface ou du stockage.

## Décision

Deux couches, et une seule direction de dépendance.

`Tarification.Domaine` ne dépend de rien : ni paquet tiers, ni infrastructure, ni interface. Il
porte les types-valeurs (`Montant`, `Quantite`) et les règles (`Panier`, `LigneDePanier`).

`Tarification.Application` dépend du domaine et de lui seul. Il porte les cas d'usage
(`CalculDuPanier`), qui sont les points d'entrée que les tests d'acceptance pilotent.

## Conséquences

Une règle commerciale ne peut pas être écrite ailleurs que dans le domaine sans que la dépendance
devienne visible dans le `.csproj` — donc sans qu'une revue la voie.

En contrepartie, une règle qui a besoin d'un service extérieur — une horloge pour une promotion
datée, un dépôt pour le stock — ne peut pas l'appeler directement : il faut la lui passer. C'est
voulu, et c'est ce qui rend les règles testables sans montage.

Les montants sont des `decimal`, jamais des `double` : un calcul de prix en virgule flottante
binaire accumule des écarts qu'aucun arrondi final ne rattrape.

## Alternatives

*Un seul projet.* Plus simple à démarrer, mais rien n'empêche alors une règle de prix d'appeler une
base de données, et la frontière ne tient plus qu'à la discipline de chacun.

*Une couche infrastructure dès maintenant.* Prématuré : ce projet n'a encore ni stockage ni
interface. Elle sera ajoutée quand un besoin réel la réclamera — l'US-6 en fera peut-être la
démonstration, puisqu'elle suppose un catalogue.
