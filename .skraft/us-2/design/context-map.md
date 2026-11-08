# Context Map — US-2

## Contextes délimités

`Tarification` : Core

Il n'y a qu'un contexte. Le projet ne contient que `Tarification.Domaine` et
`Tarification.Application` (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`,
`Tarification.sln`). US-2 n'ajoute aucun système extérieur : le barème est une valeur passée au cas
d'usage (`.skraft/us-2/passation.md:10`).

Pourquoi Core : ADR-001 décrit les règles de tarification (paliers de remise, codes promotionnels,
seuils de gratuité, arrondis) comme des règles commerciales qui se discutent avec le métier et
changent souvent (`adr-001:8-11`). C'est le cœur du produit.

## Relations

Aucune relation entre contextes dans le périmètre d'US-2 : il n'y a pas de second contexte.

Le langage ubiquitaire de `Tarification` s'enrichit des termes suivants :
- **Palier de remise** : « à partir de N articles d'une même ligne : X % » (`stories/US-2.md:7-9`) ;
- **Barème de remises** : la liste unique des paliers, la même pour toutes les références (`passation.md:5`) ;
- **Remise d'une ligne** : le pourcentage du palier le plus avantageux atteint par la quantité de cette ligne, appliqué à son sous-total (`stories/US-2.md:9-10`).

ADR-001 signale un besoin futur sans rapport avec US-2 : l'US-6 pourrait supposer un catalogue
(`adr-001:40-42`). Si un contexte « Catalogue » apparaît, sa relation avec `Tarification`
(contexte Core) devra être une ACL, jamais Conformist (skill architecture-patterns, règle 1).
