# Test Plan — US-2 — Remise par palier de quantité

Conventions reprises de la recherche (`.skraft/us-2/research/research.md`) : xUnit, `[Fact] //
@ac-N` quand le test pilote explicitement un critère numéroté, fabrique privée `Ligne(...)` pour
les fixtures. Toutes les entrées de la couche Application de cette story utilisent la même grille
de paliers « in-memory » (`GrilleDeRemise`, objet-valeur immuable construit en mémoire — il n'y a
pas de dépôt à doubler, `contracts.md`, section « Aucun dépôt… »).

## Matrice de couverture

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-1 | `CalculDuPanier.Chiffrer` | Application | aucune (grille construite en mémoire) | oui |
| @ac-2 | `CalculDuPanier.Chiffrer` | Application | aucune (grille construite en mémoire) | non |
| @ac-3 | `CalculDuPanier.Chiffrer` | Application | aucune (grille construite en mémoire) | non |
| @ac-4 | `CalculDuPanier.Chiffrer` | Application | aucune (grille construite en mémoire) | non |
| @ac-5 | `CalculDuPanier.Chiffrer` | Application | aucune (grille construite en mémoire) | non |

Pas de doublure au sens strict : `Panier` et `GrilleDeRemise` sont des objets-valeurs/agrégats
construits directement en mémoire par le test, aucun port/dépôt n'est doublé (`domain-model.md`,
section Dépôts : « Aucun nouveau dépôt »). Walking skeleton porté par @ac-1, premier scénario à
traverser `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)` de bout en bout.

## Tests déjà verts à requalifier

Le bouchon minimal de `LigneDePanier.Remise(GrilleDeRemise)` retourne toujours `Montant.Zero`
(stub de compilation, voir `impl-plan.md`) : les scénarios dont l'attendu est justement 0,00 €
passent donc déjà, avant toute implémentation réelle du choix de palier.

- @ac-1 : role: regression — justification : le bouchon `LigneDePanier.Remise` renvoie toujours
  `Montant.Zero` ; l'attendu du critère (0,00 € pour 9 articles, sous le seuil de 10) coïncide avec
  cette valeur par défaut, sans que la logique de seuil soit encore implémentée.
- @ac-4 : role: regression — justification : même bouchon ; l'attendu (aucune remise sur deux
  lignes de 6 articles, chacune sous le seuil de 10) coïncide avec `Montant.Zero` renvoyé par
  défaut pour toute ligne, indépendamment du calcul par ligne qui reste à implémenter.
- @ac-5 : role: regression — justification : même bouchon ; grille vide ou non, le stub renvoie
  `Montant.Zero` dans tous les cas, donc ce critère est vert avant toute logique de sélection de
  palier.

@ac-2 et @ac-3 restent rouges sur leur assertion métier (remise attendue non nulle : 1,00 € et
12,00 €) : ce sont eux qui pilotent l'implémentation du choix de palier et du calcul de
pourcentage dans la boucle interne.
