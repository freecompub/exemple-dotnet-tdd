# ADR-002 — Produire du JUnit XML pour les portes d'agent-studio

- Statut : Accepted
- Date : 2026-09-28

## Contexte

agent-studio décide d'avancer ou non à partir des **faits** produits par la suite de tests : combien
passent, lesquels échouent, et surtout **pourquoi** — une assertion fausse et une erreur de
compilation n'ont pas la même conséquence sur une porte.

Pour cela il lui faut un rapport qu'il sache lire. Ses lecteurs sont nommés et écrits par lui ;
il n'en invente pas. Or `dotnet test` produit nativement du TRX, qu'aucun lecteur ne couvre.

## Décision

La suite de tests produit du **JUnit XML**, via le paquet `JunitXml.TestLogger` référencé par
`tests/Dosage.Tests`. La commande est déclarée dans `.agent-studio/stack.yaml`.

## Conséquences

Sans ce paquet, `dotnet test` s'exécute mais aucun rapport n'est écrit : toutes les portes se
déclarent alors indisponibles, et le disent plutôt que de conclure à tort. Retirer cette dépendance
revient donc à désactiver silencieusement la vérification.

Le paquet doit rester compatible avec la plateforme de test du SDK utilisé. Une version trop récente
pour un SDK ancien n'est pas chargée, et l'erreur est laconique : « Impossible de localiser un
enregistreur d'événements de test ».

## Alternatives

*Garder le TRX et écrire un lecteur.* Défendable, mais c'est du code à livrer et à maintenir dans
agent-studio pour un format qu'un paquet tiers convertit déjà.

*Se passer de rapport et lire la sortie console.* Fragile : le format change d'une version à
l'autre, et rien ne distingue alors une assertion d'un plantage.
