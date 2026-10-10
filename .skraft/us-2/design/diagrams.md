# Diagrammes — US-2

**Statut : propositions non tranchees.** Les flux ci-dessous illustrent le contrat candidat, notamment l'evaluation par `ConfigurationDePaliers`, sa transmission explicite et la validation a construction. Ils ne fixent pas ces modalites pour l'implementation ; les responsabilites et le cycle de validation restent ouverts dans le modele. Sources : `.skraft/us-2/design/contracts.md:3-9` ; `.skraft/us-2/design/domain-model.md:15` ; `.skraft/us-2/design/event-model.md:17`.

## Structure et dependances

Les boites reprennent uniquement le vocabulaire des modeles. La configuration est commune aux lignes, mais n'est pas leur etat ; `Panier` reste le regroupement conceptuel existant. Les operations commerciales restent dans le domaine, la construction de `Facture` dans l'application. Sources : `.skraft/us-2/design/domain-model.md:3-19` ; `.skraft/us-2/design/event-model.md:9-15` ; `docs/adr/adr-001-decoupage-domaine-application.md:15-30` ; `.skraft/us-2/design/contracts.md:5-7`.

```text
Application
  `ChiffrerPanier` ---------------------------------> `Facture`
       | donnees                                       ^
       v                                               | resultats
Domaine                                                |
  `Panier` -> collection de `LigneDePanier` -------------+
                                |
                                +-> `Quantite`
                                +-> `Montant`

  `ConfigurationDePaliers` -> collection de `PalierDeQuantite`
         |                                        |
         | evalue chaque `LigneDePanier`           +-> `SeuilDeQuantite`
         | avec les memes paliers                 +-> `TauxDeRemise`
         v
  `RemiseDeLigne` -> somme des remises -> `Facture`
```

Les fleches figurent possession, utilisation ou transmission de resultats ; elles n'ajoutent aucun stockage ni lien de dependance du domaine vers l'application. L'application utilise les montants produits par le domaine pour construire la vue. Sources : `src/Tarification.Domaine/Panier.cs:6-16` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `docs/adr/adr-001-decoupage-domaine-application.md:15-21`.

## Validation et calcul

Dans le contrat candidat non tranche, la validation aurait lieu lors de la construction de la configuration ; l'appel explicite utiliserait cette configuration valide, l'appel historique une collection vide. Les evenements representent des faits logiques, pas des messages a distribuer. Sources : `.skraft/us-2/design/event-model.md:7-32` ; `.skraft/us-2/design/contracts.md:13-27,31-34` ; `src/Tarification.Application/CalculDuPanier.cs:20-22`.

```text
`ValiderConfigurationDePaliers`
       |
       +-- entree invalide --> `ConfigurationDePaliersRefusee`
       |                              |
       |                              v
       |                    `ResultatDeValidationDesPaliers`
       |                    rejet explicite, calcul non lance
       |
       +-- tous paliers valides --> `ConfigurationDePaliersValidee`
                                           |
                                           v
                                 `ResultatDeValidationDesPaliers`
                                 `ConfigurationDePaliers` disponible
                                           |
`Panier` ----------------------------------+
                                           v
                                  `ChiffrerPanier`
                                           |
                         pour chaque `LigneDePanier`
                                           |
                      base brute et paliers eligibles
                                           |
                        taux maximal ou remise zero
                                           v
                                    `RemiseDeLigne`
                                           |
                           brut et somme des remises
                                           v
                                     `PanierChiffre`
                                           |
                                           v
                                        `Facture`
```

L'eligibilite depend exclusivement de la quantite de la ligne ; la somme finale ne sert jamais a choisir un palier. Une configuration vide suit le chemin valide et produit zero remise, pas un refus. Sources : `stories/US-2.md:7-11` ; `.skraft/us-2/design/clarifications.md:5-6`.

## Frontiere de coherence

```text
Un appel de `ChiffrerPanier`
  `Panier` : lignes fournies au calcul
  `ConfigurationDePaliers` : collection valide, copiee et immuable
       |
       +-> chaque `RemiseDeLigne` utilise cette meme collection
       |
       +-> `PanierChiffre` -> une `Facture`
```

Cette frontiere est celle d'un calcul synchrone, non d'une transaction de persistance. La configuration n'est pas rechargee entre lignes et le calcul ne modifie ni le panier ni les paliers. Il n'introduit ni file, ni bus, ni projection asynchrone : la story exige un resultat de calcul et l'existant rend directement la facture. Sources : `stories/US-2.md:3-11` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `.skraft/us-2/design/domain-model.md:3-7` ; `.skraft/us-2/design/contracts.md:7,19,31-38`.
