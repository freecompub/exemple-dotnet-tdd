# Clarifications DESIGN US-2

Source de passation : reponses utilisateur transmises par l'orchestrateur le 2026-10-10.

## Source du bareme

Question : d'ou provient le bareme utilise pour chiffrer le panier ?
Reponse utilisateur : « Bareme fourni par l'appelant a chaque chiffrage. »

## Montant a payer

Question : faut-il deduire la remise du montant a payer des US-2 ?
Reponse utilisateur : « ATPayer : deduire la remise des US-2. »

## Validation des paliers

Question : quelles configurations autoriser et comment traiter les invalides ?
Reponse utilisateur : « Rejeter explicitement seuils <= 0, taux hors [0,100] % et seuils dupliques ; autoriser 0 % et 100 %. »
