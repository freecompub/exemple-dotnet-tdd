# US-2 - Matrice de coherence

## Correspondance des criteres

Chaque ligne de la matrice execute `ChiffrerPanier`, produit le fait logique `PanierChiffre` et observe `Facture`. Il s'agit d'une seule slice avec cinq variantes. Source : `.skraft/us-2/design/event-model.md:34-42`.

| Critere | Donnees | Invariant et porteur | `RemiseDeLigne` | `Facture.Remise` | Source |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Palier 10 / 5 % ; ligne 9 x 2,00 EUR | `LigneDePanier` : aucun seuil atteint | 0,00 EUR | 0,00 EUR | `stories/US-2.md:7` ; `.skraft/us-2/design/domain-model.md:35-37` |
| AC-2 | Palier 10 / 5 % ; ligne 10 x 2,00 EUR | `LigneDePanier` : seuil inclusif ; 20 x 5 / 100 | 1,00 EUR | 1,00 EUR | `stories/US-2.md:8` ; `.skraft/us-2/design/domain-model.md:35-36` |
| AC-3 | Paliers 10 / 5 % et 50 / 12 % ; ligne 50 x 2,00 EUR | `LigneDePanier` : maximum entre 5,00 et 12,00 EUR, sans cumul | 12,00 EUR | 12,00 EUR | `stories/US-2.md:9` ; `.skraft/us-2/design/domain-model.md:36-37,41` |
| AC-4 | Palier 10 / 5 % ; deux references differentes, chacune en quantite 6 | `LigneDePanier` : evaluation independante ; `Panier` : addition des remises, jamais des quantites | 0,00 EUR pour chaque ligne | 0,00 EUR | `stories/US-2.md:10` ; `.skraft/us-2/design/domain-model.md:38-39` |
| AC-5 | `PaliersDeQuantite` vide ; une ligne | Aucun candidat : succes avec remise nulle | 0,00 EUR | 0,00 EUR | `stories/US-2.md:11` ; `.skraft/us-2/design/event-model.md:44` |

## Coherence entre modele, architecture et contrat

| Sujet | Modele de reference | Traduction dans le contrat | Verification attendue et source |
| --- | --- | --- | --- |
| Frontiere de responsabilite | Regle commerciale dans le domaine, orchestration dans l'application | Calcul independant porte par `LigneDePanier` ; somme portee par `Panier` ; restitution par `Facture` | Conserver la direction de dependance existante : `docs/adr/adr-001-decoupage-domaine-application.md:15-30` ; `.skraft/us-2/design/domain-model.md:11-16,59` |
| Fourniture des paliers | `ChiffrerPanier` recoit panier et paliers communs | Valeurs explicites au chiffrage ; pas de depot ni d'administration | Les memes `PaliersDeQuantite` sont utilises pour toutes les references : `.skraft/us-2/design/event-model.md:11-19,25,30` ; `.skraft/us-2/design/domain-model.md:26,51-53` |
| Choix du meilleur palier | Maximum des remises applicables, pas du seuil | Aucun cumul ni dependance a l'ordre des paliers | Verifier aussi un taux plus avantageux sur un seuil inferieur : `.skraft/us-2/design/domain-model.md:37,41` |
| Isolation des lignes | Pas de regroupement de lignes ni de somme des quantites | Chaque `RemiseDeLigne` depend seulement de sa ligne et des paliers communs | Deux lignes de quantite 6 restent sous le seuil, meme sans regroupement par reference : `.skraft/us-2/design/domain-model.md:38` ; `stories/US-2.md:10` |
| Precision | `Montant` en `decimal` ; pas d'arrondis intermediaires enchaines | Calcul brut, selection du maximum et somme sans arrondi intermediaire | Remises exactes des cinq criteres ; arrondi client rattache a US-5 : `docs/adr/adr-001-decoupage-domaine-application.md:32-33` ; `.skraft/us-2/design/event-model.md:38-42,50` ; `stories/US-5.md:8-10` |
| Somme brute | `SommeDesArticles` conserve son sens | Aucun remplacement par une somme nette | Preserver les exemples 13,50 EUR, 15,90 EUR et panier vide : `.skraft/us-2/design/domain-model.md:39` ; `stories/US-1.md:7-9` |
| Montant payable | Raccordement signale par le modele ; stories voisines decrivent un total reduit | `ATPayer` deduit `Remise` une seule fois puis ajoute le port | Pour AC-2, 20,00 EUR bruts - 1,00 EUR = 19,00 EUR ; pour AC-3, 100,00 EUR - 12,00 EUR = 88,00 EUR : `.skraft/us-2/design/domain-model.md:60` ; `stories/US-2.md:8-9` ; `stories/US-3.md:11` ; `stories/US-4.md:10` |
| Compatibilite sans paliers | Appel existant et ensemble vide autorise | Appel sans paliers conserve ; remise nulle | Preserver les appels d'acceptance existants : `src/Tarification.Application/CalculDuPanier.cs:22` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35` ; `stories/US-2.md:11` |
| Erreurs existantes | Quantite inferieure a un et montant negatif refuses | Aucun retour de `Facture` a zero pour masquer un rejet | Preserver les assertions d'exception existantes : `.skraft/us-2/design/event-model.md:44` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:38-49` |
| Evenement logique | `PanierChiffre` ne prescrit pas d'emission ni de persistance | Retour direct de `Facture`, panier non modifie | Aucune nouvelle mutation ou infrastructure de messages : `.skraft/us-2/design/event-model.md:7,26` ; `.skraft/us-2/design/domain-model.md:47,51` |

## Raccordements de perimetre

| Sujet | Limite retenue pour US-2 | Source |
| --- | --- | --- |
| Promotion | Pas d'entree ni de calcul promotionnel ajoute dans cette slice ; l'interaction est rattachee a US-3 | `.skraft/us-2/design/event-model.md:25,50` ; `.skraft/us-2/design/domain-model.md:62` |
| Port | Champ conserve a zero ; future evaluation du seuil sur le montant apres remise | `src/Tarification.Application/CalculDuPanier.cs:5-8,22` ; `stories/US-4.md:10` |
| Validation des taux et des doublons | Aucune nouvelle borne ou regle de rejet inventee par le contrat | `.skraft/us-2/design/domain-model.md:28` |
| Persistance | Aucun depot de panier ou de paliers ; les valeurs sont fournies au calcul | `.skraft/us-2/design/domain-model.md:51-53` ; `.skraft/us-2/design/event-model.md:30` |
