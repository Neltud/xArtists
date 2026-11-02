---
description: >-
  Preuves et responsables requis avant pilote sandbox et ouverture marchande
  xArtists.
---

# Critères de lancement

État initial : audit du 28 octobre, `352de2dc…`. Chaque clôture doit citer commit complet, environnement, commande, sortie, horodatage et responsable de revue. « Non testé », « non attesté » et « bloqué » ne valent pas succès.

### Trois autorisations distinctes

| Niveau                       | Périmètre                                                     | Condition                                                                |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Public paper                 | Consultation, démonstration et données clairement identifiées | Source du build visible ; pas de promesse de trading ou livraison réelle |
| Sandbox contrôlé             | Faux paiements PSP, wallets de test, commandes persistantes   | Tests et restauration validés ; GO infra gratuit et version précise      |
| Marchand / mainnet financier | Encaissement, droits livrés, fonds ou actifs utilisateurs     | Tous les blocages ci-dessous levés et GO humain explicite par capacité   |

Un GO pour publier une documentation ou lancer une recette ne vaut pas GO marchand. Le déploiement de l'API, l'injection de sa variable frontend et le rebuild Pages sont également des changements distincts.

### Tableau de décision

| ID  | Preuve de sortie                                                                                        | Responsable proposé                        | État au 28 octobre                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| G01 | PR #200 : async cohérent, concurrence fichier corrigée, `pg` et lock complet, `npm ci`                  | Grok code ; ChatGPT vérifie les SHA        | Partiel : verrou/TLS corrigés, lock/tests v2 bloquants |
| G02 | Postgres réel : deux IPN concurrents, transaction réutilisée, panne, restart et restauration            | Développeur + opérateur DB                 | Non testé                                              |
| G03 | Backend obligatoire, TLS validé, aucune commande perdue ni fallback éphémère                            | Opérateur API                              | Non attesté                                            |
| G04 | Règles GitHub effectives, revue humaine, checks requis au SHA, secrets séparés                          | Administrateur GitHub                      | Partiellement lisible, preuve admin requise            |
| G05 | Propriétaires métier/compte et pouvoir d'upgrade contrôlés ; provenance WASM reproductible              | Opérateur contrats + revue indépendante    | Owner unique, provenance non produite                  |
| G06 | Pause et reprise vérifiées par ABI ; exercice sans mutation réelle puis exercice explicitement approuvé | Opérateur contrats                         | Deux vues `isPaused` absentes ; exercice manquant      |
| G07 | Corruption et concurrence des budgets : arrêt, réservation atomique et caps durables                    | Développeur exécuteur                      | Défaut reproduit ; live fermé                          |
| G08 | Alertes dépendances triées, correctifs compatibles, wallet/SIWX retestés                                | Mainteneur frontend                        | 30 paquets signalés, triage ouvert                     |
| G09 | Date invalide, cache futur/sans empreinte/refresh suspendu fermés                                       | Développeur API/frontend                   | Sondes complémentaires rouges                          |
| G10 | Prix et devis serveur consommé ; même SKU et même valeur sur les rails                                  | Responsable produit + développeur          | Non aligné                                             |
| G11 | Identité buyer, PSP, commande, livraison et droits liés ; refund et reprise éprouvés                    | Responsable checkout                       | Livraison simulée                                      |
| G12 | xPortal sur appareil, guest refusé, autre buyer refusé, IPN sandbox externe, `?paid=` sans droit        | Recette produit                            | Fixtures passent ; recette externe manquante           |
| G13 | Journal sans PII/secrets, contact incident accepté, export/restauration et quotas connus                | Opérateur                                  | Non attesté                                            |
| G14 | Vendeur, frais, remboursements, droits artistes, données/images et éventuelle custody validés           | Responsable commercial / conseil compétent | Hors validation technique                              |

La validation d'un acteur ne clôture pas son propre travail sans preuve de revue. Les tests des chemins signant ou diffusant ne doivent jamais hériter de clés réelles.

### Mise à jour P0 — 2 novembre 2026 (livraison NFT)

La [PR #282](https://github.com/Neltud/xArtists/pull/282) est fusionnée et sa CI est verte. Elle évite qu'un IPN PayBox signé, à lui seul, inscrive une livraison NFT fictive. L'API retourne désormais un statut de livraison en attente et exige une attestation indépendante avant un statut confirmé. La présence du contrat et un retour GitHub Actions HTTP 204 ne sont **pas** des preuves d'une livraison au bon acheteur. Le service Render est déployé mais le dispatch mint reste inactif (`mint_dispatch_enabled=false`), malgré les flags dry-run ; aucun jeton de dispatch GitHub n'a été attesté.

Audit Neon en lecture agrégée : la base **sandbox** accessible compte deux anciennes lignes marquées `simulated` avec horodatage, et zéro avec `server_confirmed=true`. La correspondance de ce projet Neon avec la base effectivement utilisée par Render **n'est pas prouvée**. Aucune migration de lignes commerciales n'a été effectuée.

**G11/G12 ne sont pas clôturés** : il reste à valider l'identité de la base de production sans exposer la chaîne de connexion, la signature IPN en environnement isolé, les retries, la réconciliation on-chain, l'idempotence après panne, S1/S2 et les remboursements. Voir l'[issue #281](https://github.com/Neltud/xArtists/issues/281). GO commercial : **NON**.

### Ordre des lots

1. **Fiabilité et preuve** : corriger PR #200, état de risque, cache et CI trompeuse. Conserver les assertions métier ; ne pas fusionner la release pour masquer les échecs.
2. **Pilote gratuit** : migrations versionnées, base de test isolée, restauration, API Render Free si admissible au compte. Pas de paiement réel ; pas de carte ni offre payante.
3. **Cohérence commerciale** : catalogue, taux serveur, devis durable, rails et droits, livraison idempotente. Une seule chaîne et un seul actif d'abord.
4. **Ouverture progressive** : petite cohorte sandbox, puis décision humaine sur un SHA et une capacité. Pas de bascule globale « tout ouvrir ».

L'offre gratuite doit être mesurée face aux exigences de callback PSP : veille, temps de réveil, retry, panne DB et rapprochement. Si les exigences ne sont pas satisfaites à budget 0 €, le mode marchand reste fermé ; l'automatisation ne change pas de plan à la place du responsable.

### Dossier de GO

Le responsable humain reçoit : SHA d'application, SHA du build réellement servi, manifeste de configuration sans secrets, résultats CI non ignorés, écarts acceptés explicitement, journal de recette, restauration et arrêt testés, capacité exacte à ouvrir et procédure de retour à l'état fermé.

Une expiration, une dérive de hash/owner, un budget non rapproché ou une preuve inaccessible retire l'éligibilité à ce GO. Les actions de pause ou de rotation restent exécutées par l'opérateur autorisé, pas par le rapport quotidien.
