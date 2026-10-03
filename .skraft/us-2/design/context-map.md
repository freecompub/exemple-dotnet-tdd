# Carte des contextes — US-2 : Remise par palier de quantité

## Constat

Le dépôt ne contient qu'un seul projet de domaine et un seul projet d'application
(`src/Tarification.Domaine/`, `src/Tarification.Application/` — voir structure du dépôt). Aucune
autre équipe, aucun autre service, aucune autre base de code consommant ou exposant ces projets
n'est mentionné dans les ADR existants (`docs/adr/adr-001-decoupage-domaine-application.md`,
`docs/adr/adr-002-format-de-rapport-de-tests.md`) ni dans les stories (`stories/US-1.md` à
`stories/US-6.md`). Il n'y a donc qu'un seul Bounded Context identifié à ce jour : **Tarification**.

## Sous-domaine

Le calcul de remise par palier est une règle de tarification : ADR-001 cite explicitement « paliers
de remise » comme exemple de règle commerciale centrale à ce contexte
(`docs/adr/adr-001-decoupage-domaine-application.md`, section Contexte). C'est donc une règle du
sous-domaine **Core** (Tarification) — pas une fonctionnalité Supporting ou Generic : elle porte la
logique métier différenciante que ce dépôt existe pour encoder.

## Relations entre contextes

Aucune. US-2 ne requiert aucune donnée externe au `Panier` et à la `GrilleDePaliers` qui lui est
fournie ; elle ne dépend d'aucun autre contexte (ni service de stock — voir `stories/US-6.md`, ni
service de promotion — voir `stories/US-3.md` à `stories/US-5.md`, non encore investiguées pour
cette story). Pas de relation Conformist/ACL/OHS/PL à documenter : il n'y a qu'un nœud.

```
graph LR
    Tarification[Tarification — Core]
```

## Vigilance pour les US suivantes

`stories/US-6.md` introduit un « catalogue » de stock par référence. Si une US future réintroduit
une grille de paliers **par référence** (plutôt que la grille globale unique retenue pour US-2 — voir
réponse utilisateur dans `event-model.md`), elle pourrait partager ce catalogue ou en créer un
propre : cette question est hors périmètre d'US-2 et n'est pas tranchée ici.
