# exemple-dotnet-tdd — projet d'essai pour `/tdd` et `/skraft`

> Domaine neutre, sans rapport avec un produit existant.

Petit projet .NET destiné à **faire tourner les agents d'agent-studio sur du vrai code** : des US à
livrer, des ADR à respecter, une suite de tests qui donne aux portes de quoi mesurer.

Le domaine est la **tarification d'un panier** : volontairement banal, pour que l'attention aille au
déroulé des agents et non au métier. Six stories, dont une seule livrée — de quoi relancer les
agents plusieurs fois sur du terrain neuf.

## Ce que le projet contient

| Chemin | Rôle |
| --- | --- |
| `stories/US-1.md` | **Déjà livrée.** Chiffrage ligne à ligne. Sert de référence de forme et donne une base verte aux portes. |
| `stories/US-2.md` | Remise par palier de quantité. 5 critères, 1 question ouverte. |
| `stories/US-3.md` | Code promotionnel. 5 critères, 2 questions — dont le cumul avec l'US-2. |
| `stories/US-4.md` | Frais de port offerts au-delà d'un seuil. Dépend de l'ordre d'application avec les remises. |
| `stories/US-5.md` | Arrondi au centime. La story la plus piégeuse : elle porte sur l'ordre des opérations. |
| `stories/US-6.md` | Refus si stock insuffisant. Introduit un catalogue, donc une dépendance extérieure. |
| `docs/adr/adr-001-*.md` | Découpage domaine / application. La lentille d'architecture s'y réfère. |
| `docs/adr/adr-002-*.md` | Pourquoi les tests produisent du JUnit XML. |
| `.agent-studio/stack.yaml` | Profil de stack : commande de test, emplacements, erreurs de compilation, canaris. |
| `src/Tarification.Domaine` | Règles métier. Ne dépend de **rien**. |
| `src/Tarification.Application` | Cas d'usage. Dépend du domaine, et de lui seul. |
| `tests/Tarification.Tests` | Tests unitaires et d'acceptance. |

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
4. `/skraft stories/US-2.md` — déroule la story de la recherche à la livraison. Puis US-3, US-4, US-5, US-6 : cinq essais indépendants.
5. `/tdd` — pour une fonctionnalité décrite en langage courant, sans passer par une story.

## Ce qui a été vérifié

Toute la chaîne, en faisant tourner le code réel d'agent-studio contre ce projet :

- les six stories sont lues par `parseStory` — identifiants, critères numérotés, littéraux ;
- `.agent-studio/stack.yaml` est accepté par `parseStackProfile` ;
- `dotnet test` compile, passe ses cinq tests et écrit un JUnit XML que notre lecteur relit
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
