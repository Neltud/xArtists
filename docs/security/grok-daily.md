---
description: Passation quotidienne de travail Grok et ChatGPT, SHA et critères de clôture.
---

# Passation quotidienne Grok

### Point de départ du 28 octobre

Main `352de2dc8abcba08885506e4f5b44e4c67cc5c05` ; PR #200 head `21e043d33644da04facab8915ea55827f056d122`, ouverte ; CI installation rouge. Nouveau contrôle local : 59/61 tests, deux tests v2 async restent à adapter. Concurrence fichier 3/3 corrigée, TLS vérifié par défaut et pg déclaré. PR #201 release ouverte. LIA paper, Paybox frontend désactivé, API vide. Aucune fusion ou publication automatique autorisée.

Neon sandbox existe, sans table de commandes visible ; neuf tables `neon_auth` ne prouvent pas une intégration avec la dapp. Aucun service retourné dans le workspace Render contrôlé. Aucun secret n'est demandé dans cette passation.

### Propriété des chemins

| Lot                                                               | Auteur                                               | Vérificateur                           |
| ----------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| PR #200 : orders/server, dépendances, migration et tests associés | Grok, sur sa branche existante                       | ChatGPT : SHA, diff et sondes isolées  |
| README, documents sécurité et kit GitBook de cet audit            | ChatGPT, branche documentaire isolée                 | Grok / mainteneur : manifeste et rendu |
| Risque exécuteur, cache runtime, CI et dépendances wallet         | À attribuer avant écriture ; nouvelles PR distinctes | Autre agent ou mainteneur              |
| Paramètres hébergeur, clés, owner/upgrade, pause et publication   | Opérateur humain autorisé                            | Seconde personne / revue indépendante  |

Ce tableau n'attribue pas à deux agents les mêmes fichiers. Il ne crée pas un verrou distant : une nouvelle session doit confirmer l'état et le propriétaire avant toute écriture.

### Travail demandé à Grok — lot immédiat

1. Relire tip et diff PR #200. Générer le vrai lockfile : le head 21e043d contient encore uniquement l'entrée racine, malgré les messages de commit. Rejouer `npm ci` propre. Adapter les deux tests `paybox_v2` aux Promises en conservant les assertions d'accès, idempotence et persistance.
2. Conserver les corrections déjà vérifiées : verrou async fichier, attente non bloquante, TLS `rejectUnauthorized:true`, pg déclaré et workflow `npm ci`. La sonde conserve désormais les trois commandes. Produire les SHA et une CI complète verte, puis tester Postgres réel sur une base/branche isolée approuvée ; ne pas confondre succès fichier et validation DB.
3. Garder release #201 et ouverture infra dépendantes des checks et du GO humain. Ne pas livrer l'API sur fichier éphémère en prétendant les commandes durables. Aucun test supprimé, erreur masquée ou `continue-on-error`.

Les lots suivants traitent S02 (état de risque), S07/S08 (cache/expiry), S05 (preuves CI), S06 (dépendances) et la matrice prix/droits/livraison. Leur propriétaire de fichiers doit être fixé avant de commencer. Aucune réécriture en parallèle d'un chemin réservé à Grok.

### Gabarit quotidien

```
GROK ↔ CHATGPT — YYYY-MM-DD HH:MM Europe/Paris
Base main : <SHA complet relu>
PR / head / CI : <numéro, SHA, PASS|FAIL|SKIPPED|ACTION_REQUIRED>
Build servi : <source_sha, built_at, flags, URL>
Delta depuis le dernier rapport : <faits vérifiés seulement>
P0/P1 ouverts : <ID, impact, preuve, responsable>
Chemins réservés : <path = auteur ; autre agent = vérificateur>
Artefacts : <nom, octets, SHA-256 calculé, lien>
Vérification : <commande et résultat réel ; non exécuté si applicable>
Prochain lot : <3 actions maximum, dépendances>
Inconnus : <permissions, infra, tests externes non attestés>
GO nécessaires : <opération précise ; aucun GO implicite>
Stop : budget 0 €, LIA paper, pas de paiement/TX/merge/deploy auto.
```

Les SHA abrégés servent à la lecture ; utiliser les SHA complets pour les écritures et comparaisons. Vérifier l'archive et son manifeste avant copie. Un test d'hier à head inchangé peut être cité avec sa date ; un head nouveau doit être réévalué.

### Canal et limites

Le rapport quotidien prépare ce relais dans ChatGPT. Le kit GitBook est en revue, pas automatiquement publié. Aucun message n'a été envoyé à une conversation Grok depuis cette session : le contrôle de conversation n'a pas de surface authentifiée et vérifiée disponible. Un opérateur peut transmettre le kit et demander un accusé incluant les SHA ; l'accusé ne vaut pas vérification d'exécution.
