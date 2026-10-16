# Context Map — US-2

## Contextes

`Tarification` : Core

Justification : les paliers de remise sont des règles commerciales qui « se discutent avec des gens du métier » et changent souvent (`docs/adr/adr-001-decoupage-domaine-application.md:8-10`). US-2 reste entièrement dans ce contexte : barème, lignes, montants et facture partagent le même langage (`src/Tarification.Domaine/LigneDePanier.cs:4` ; `src/Tarification.Application/CalculDuPanier.cs:10`).

## Relations

Aucune relation entre contextes pour US-2 : la story n'a besoin d'aucune donnée extérieure, le barème accompagne la requête (`stories/US-2.md:7-11` ; `.skraft/us-2/research/research.md:9-11`). Aucun patron n'est donc attribué.

Le catalogue évoqué par l'ADR-001 (`docs/adr/adr-001-decoupage-domaine-application.md:40-42`) n'est pas modélisé ici : il ne relève pas des critères US-2.
