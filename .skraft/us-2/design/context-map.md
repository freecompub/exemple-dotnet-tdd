# Context Map — US-2 — Remise par palier de quantité

## Réutilisation

Le dépôt ne porte qu'un seul bounded context : aucune recherche (`.skraft/us-2/research/
research.md`) ni aucun fichier du dépôt (`src/`, `docs/adr/`) ne fait apparaître un second module,
une seconde équipe ou un second langage métier. US-2 ne crée ni n'étend aucune relation entre
contextes : elle ajoute une règle à l'intérieur du contexte existant.

## Contexte

- `Tarification` : **Core**. L'ADR-001 nomme explicitement les « paliers de remise » comme l'une
  des règles commerciales qui justifient la séparation domaine/application
  (`docs/adr/adr-001-decoupage-domaine-application.md`, section Contexte : « La tarification porte
  des règles commerciales : paliers de remise, codes promotionnels, seuils de gratuité,
  arrondis. »). `README.md` confirme que « le domaine est la tarification d'un panier » : c'est
  l'objet entier du dépôt, donc son cœur, pas une fonction annexe.

## Relations

Aucune relation entre contextes n'existe aujourd'hui : `Tarification.Domaine` ne dépend de rien et
`Tarification.Application` ne dépend que du domaine (`docs/adr/adr-001-decoupage-domaine-
application.md`, section Décision). US-2 n'introduit aucun appel sortant ni aucune donnée entrante
d'un autre contexte — les paliers de remise sont une donnée interne au contexte `Tarification`
(réponse utilisateur : « Les mêmes paliers s'appliquent à toutes les références », donc aucune
dépendance vers un référentiel produit externe).

Un contexte candidat apparaît dans `stories/US-6.md` (catalogue, cité par `README.md` : « Introduit
un catalogue, donc une dépendance extérieure »), mais il est hors du périmètre d'US-2 et n'est pas
modélisé ici.

## À reconsidérer

Aucun ADR existant ne porte sur une relation entre contextes (seuls `adr-001` et `adr-002`
existent, et aucun ne mentionne de second contexte) : rien à reconsidérer sur ce point pour US-2.
