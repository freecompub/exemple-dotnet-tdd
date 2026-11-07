# Context Map — US-2

## Contextes délimités

- `Tarification` : Core

Justification : la tarification porte les règles commerciales (paliers de remise, codes promotionnels,
seuils de gratuité, arrondis) discutées avec le métier et appelées à changer souvent
(`docs/adr/adr-001-decoupage-domaine-application.md:8-11`). Son modèle vit dans
`Tarification.Domaine`, ses cas d'usage dans `Tarification.Application`
(`docs/adr/adr-001-decoupage-domaine-application.md:17-21`).

US-2 reste entièrement dans ce contexte : `Panier`, `LigneDePanier`, `Montant`, `Quantite`,
`CalculDuPanier`, `Facture` y sont déjà (`.skraft/us-2/research/research.md:104-110`), et les nouveaux
concepts (`GrilleDePaliers`, `PalierDeQuantite`, `Pourcentage`) relèvent de la même langue.

## Relations entre contextes

Aucune pour US-2 : un seul contexte, ni stockage ni interface ni service extérieur
(`docs/adr/adr-001-decoupage-domaine-application.md:40-41`). La grille de paliers est une
configuration passée au cas d'usage, pas un modèle importé d'un autre contexte
(`.skraft/us-2/passation.md:9`).
