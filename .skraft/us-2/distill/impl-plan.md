# US-2 — Plan de réalisation

## État remis par DISTILL

Six scénarios métier, chacun traduit en test d'acceptance xUnit, couvrent les cinq critères.
Les trois types de configuration ne sont que des signatures provisoires sans règles.
La surcharge `Chiffrer(Panier, GrilleDePaliers)` ignore provisoirement la grille et délègue
au comportement existant : aucun calcul de production ajouté, aucune exception artificielle.
Ne pas conserver ces bouchons comme une réalisation finale.

## Boucle extérieure et raccords

1. Partir du rouge `Ac2_Le_client_atteint_le_seuil_de_remise`, puis du rouge
   `Ac3_Le_client_beneficie_du_seul_palier_le_plus_avantageux`, par la frontière applicative réelle.
   Ne pas modifier les résultats attendus pour rendre les bouchons verts.
2. Réaliser les objets-valeurs selon `design/contracts.md` et `research/clarification.md` :
   taux `decimal` en pourcentage dans ]0 %, 100 %], seuil >= 1, seuils distincts,
   copie immuable de la configuration et rejet explicite à la construction.
   Réutiliser `Quantite` et `Montant`, sans dépôt ni configuration globale.
3. Faire émerger `Montant.Multiplie(TauxDeRemise)` et `GrilleDePaliers.RemiseDe(LigneDePanier)` :
   filtrer les paliers atteints et retenir la remise maximale, non le seuil maximal,
   sans cumul, sans dépendance à l'ordre, sans arrondi intermédiaire.
4. Ajouter `Panier.RemiseDe(GrilleDePaliers)` pour sommer les remises évaluées séparément
   sur les lignes existantes. Ne regrouper ni les références ni les quantités.
5. Raccorder `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` à ce calcul, avec rejet
   explicite des entrées nulles. Conserver l'appel historique en le faisant déléguer à une grille vide.
   Conserver la somme brute et les frais de port à zéro pour US-2.
6. Faire émerger la soustraction validée de `Montant`, puis raccorder
   `Facture.ATPayer = SommeDesArticles - Remise + FraisDePort`.
   Les tests 2 et 3 doivent rester exigeants sur le montant réellement payable, pas seulement la remise.

## Discipline et périmètre

Préserver les signatures utilisées par les tests et la non-régression US-1.
Les constructeurs précis des nouveaux objets-valeurs sont la convention minimale choisie ici ;
leur validation demeure à implémenter, pas à simuler dans les fabriques d'acceptance.
Pas d'événements publiés, pas de stockage, pas d'extension promotionnelle ou d'arrondi US-5.
Les faits du modèle restent explicatifs, conformément au DESIGN validé.

La boucle interne décide des tests techniques nécessaires : aucun test de domaine de la sélection
déjà couverte par les critères sans ouverture démontrée d'un gate M4.
Les cas défensifs inaccessibles par une commande valide peuvent justifier
`branch_unreachable_via_AC` ; documenter cette raison avant extraction.
Les invariants utilisateur de configuration ne doivent pas être inventés ou silencieusement corrigés.

La validation passe exclusivement par `run_tests`. Vérifier les assertions métier des rouges
puis les six acceptances et les cinq tests existants lors de la réalisation.
Les contrôles de l'orchestrateur (commits, portes, mutation) ne sont pas exécutés dans cette phase.
