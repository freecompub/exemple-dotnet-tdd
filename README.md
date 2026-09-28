# exemple-dotnet-tdd — projet d'essai pour `/tdd` et `/skraft`

Petit projet .NET destiné à **faire tourner les agents d'agent-studio sur du vrai code** : une US à
livrer, des ADR à respecter, une suite de tests qui donne aux portes de quoi mesurer.

Le domaine est volontairement étroit — plafonner une dose d'insuline — pour que les règles tiennent
en quelques lignes et que l'attention aille au déroulé des agents, pas au métier.

## Ce que le projet contient

| Chemin | Rôle |
| --- | --- |
| `stories/US-1.md` | **Déjà livrée.** Sert de référence de forme, et donne une base verte aux portes. |
| `stories/US-2.md` | À livrer : plafond journalier. Cinq critères, deux questions ouvertes. |
| `stories/US-3.md` | À livrer : arrondi au pas de l'instrument. Dépend de l'ordre d'application avec le plafond. |
| `docs/adr/adr-001-*.md` | Découpage domaine / application. La lentille d'architecture s'y réfère. |
| `docs/adr/adr-002-*.md` | Pourquoi les tests produisent du JUnit XML. |
| `.agent-studio/stack.yaml` | Profil de stack : commande de test, emplacements, erreurs de compilation, canaris. |
| `src/Dosage.Domaine` | Règles métier. Ne dépend de **rien**. |
| `src/Dosage.Application` | Cas d'usage. Dépend du domaine, et de lui seul. |
| `tests/Dosage.Tests` | Tests unitaires et d'acceptance. |

## Pré-requis

Un **SDK .NET 8 ou plus récent** :

```bash
brew install --cask dotnet-sdk
dotnet --list-sdks     # doit afficher 8.x ou plus
```

Un SDK ancien (≤ 6) ne charge pas `JunitXml.TestLogger` : `dotnet test` s'exécute, mais aucun
rapport n'est écrit, et **toutes les portes d'agent-studio se déclarent indisponibles**. Elles le
disent plutôt que de conclure à tort, mais aucun agent ne peut alors travailler.

## Vérifier que la chaîne marche, avant de lancer un agent

```bash
dotnet test --nologo --logger "junit;LogFilePath=/tmp/rapport.xml"
head -c 300 /tmp/rapport.xml      # un fichier doit exister, et contenir <testsuites>
```

Si ce fichier n'apparaît pas, rien d'autre ne fonctionnera : reprendre par là.

## S'en servir dans agent-studio

1. Ouvrir ce dossier comme projet.
2. `/stack` — doit annoncer la stack **`dotnet`, déclarée** par `.agent-studio/stack.yaml`.
3. `/stack doctor` — éprouve le profil en l'exécutant : les quatre canaris doivent ressortir `ok`.
   C'est à faire **avant** tout agent : si le classement des échecs est faux, les portes le seront aussi.
4. `/skraft stories/US-2.md` — déroule la story de la recherche à la livraison.
5. `/tdd` — pour une fonctionnalité décrite en langage courant, sans passer par une story.

## Ce qui a été vérifié, et ce qui ne l'a pas été

**Vérifié**, en faisant tourner le code d'agent-studio sur ces fichiers :

- les trois stories sont lues par `parseStory` — identifiants, critères numérotés, littéraux ;
- `.agent-studio/stack.yaml` est accepté par `parseStackProfile` et déclare ses quatre canaris ;
- le motif `buildErrors` classe correctement de vraies erreurs du compilateur C# — `CS0103` et
  `CS0246` en `missing_symbol`, `CS1002` (« ; expected ») en `other_error`.

**Non vérifié** : la compilation et les tests eux-mêmes. La machine sur laquelle ce projet a été
écrit n'a qu'un SDK 3.0, de 2019, incapable de charger l'enregistreur JUnit. Les versions de paquets
de `tests/Dosage.Tests.csproj` n'ont donc pas été confrontées à un vrai `dotnet restore`. Commencer
par la section « Vérifier que la chaîne marche » ci-dessus.
