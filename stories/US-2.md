# US-2 — Un plafond journalier, en plus du plafond par prise

En tant que patient, je veux que la somme des bolus d'une même journée ne dépasse pas un plafond
journalier, afin qu'un enchaînement de doses correctes prises séparément ne devienne pas dangereux.

## Critères d'acceptation
1. Plafond journalier de 30 U, 20 U déjà pris aujourd'hui, calcul à 6 U : dose proposée 6 U, pas d'alerte.
2. Plafond journalier de 30 U, 28 U déjà pris aujourd'hui, calcul à 6 U : dose proposée 2 U, alerte « Plafond journalier atteint ».
3. Plafond journalier de 30 U, 30 U déjà pris aujourd'hui, calcul à 4 U : dose proposée 0 U, alerte « Plafond journalier atteint ».
4. Le plafond par prise et le plafond journalier s'appliquent tous les deux : plafond par prise 10 U, journalier 30 U, 25 U déjà pris, calcul à 12 U : dose proposée 5 U.
5. Aucun plafond journalier configuré : seul le plafond par prise s'applique.

## Questions ouvertes
- La journée commence-t-elle à minuit, ou 24 h après la première prise ?
- Que fait-on d'une prise enregistrée après coup, qui ferait dépasser un plafond déjà atteint ?
