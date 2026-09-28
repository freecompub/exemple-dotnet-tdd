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

Le projet cible **`net10.0`**, et il faut le **runtime** correspondant, pas seulement le SDK :

```bash
dotnet --list-sdks       # 10.x
dotnet --list-runtimes   # Microsoft.NETCore.App 10.x doit y figurer
```

Deux pièges rencontrés en montant ce projet, tous deux muets jusqu'à l'exécution :

- **SDK moderne mais runtime absent.** La compilation réussit, puis le processus de test refuse de
  démarrer (« You must install or update .NET to run this application »). Le rapport JUnit est alors
  écrit, mais **vide** — `<testsuites />`. agent-studio le signale comme un avertissement : un
  rapport lisible sans aucun test veut dire que rien n'a été mesuré.
- **SDK ancien (≤ 6).** `JunitXml.TestLogger` ne se charge pas, et l'erreur est laconique :
  « Impossible de localiser un enregistreur d'événements de test ». Aucun rapport n'est écrit, et
  toutes les portes se déclarent indisponibles.

Pour changer de version cible, une seule ligne : `TargetFramework` dans `Directory.Build.props`.

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

## Ce qui a été vérifié

Toute la chaîne, en faisant tourner le code réel d'agent-studio contre ce projet :

- les trois stories sont lues par `parseStory` — identifiants, critères numérotés, littéraux ;
- `.agent-studio/stack.yaml` est accepté par `parseStackProfile` ;
- `dotnet test` compile, passe ses quatre tests et écrit un JUnit XML que notre lecteur relit
  correctement, identifiants compris ;
- **les quatre canaris ressortent `ok`** en exécution réelle : un test trivial passe, une assertion
  fausse est classée `assertion`, un symbole absent `missing_symbol`, et une syntaxe cassée
  `other_error` — donc rejetée par la porte RED, ce qui est tout l'enjeu.

### Le classement se fait sur les CODES d'erreur, pas sur les messages

Première version du profil : `missingSymbol` listait des bouts de phrases anglaises (« does not
exist in the current context »). Les canaris l'ont refusée en exécution réelle, et ils avaient
raison — **le compilateur est traduit** : sur cette machine il écrit « Le nom 'x' n'existe pas dans
le contexte actuel ». Aucune sous-chaîne anglaise ne pouvait matcher, et un symbole absent ressortait
en `other_error`, ce qui aurait bloqué chaque cycle TDD.

Le profil capture donc le **code** (`CS0103`, `CS0246`, `CS1061`…) avec le message, et classe
dessus. Les codes ne changent pas d'une langue à l'autre. À retenir pour tout profil visant un
compilateur : viser ce que l'outil ne traduit pas.
