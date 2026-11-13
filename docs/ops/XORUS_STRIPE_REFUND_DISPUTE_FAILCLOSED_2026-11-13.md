# xArtists / xOrus — remboursement et litige d'abonnement Stripe (test isolé)

Date : 13 novembre 2026. **Aucun encaissement ni abonnement réel activé**.

## Objectif de sécurité

La PR #567 fournit un registre de souscription **test** PostgreSQL, signature Stripe, identifiant client et prix, mais ne disposait pas d'un moyen sûr de rattacher les incidents de paiement aux factures. Cette PR ajoute un circuit **révocation uniquement**, sans émission de nouveaux droits commerciaux, sans accès client et sans route HTTP.

- Lors d'une `invoice.paid` correctement signée en `livemode=false`, le registre conserve l'identifiant de facture, l'identifiant **PaymentIntent** et la souscription déjà associée à un compte vérifié. Unique `payment_intent_id` et `invoice_id`. La facture payée ne peut plus être acceptée sans PaymentIntent explicite.
- Un `charge.refunded` signé, correspondant à un PaymentIntent **déjà payé et lié** au même compte Stripe, impose `status=canceled`, `refunded=true` et `terminal=true`. **Tout remboursement partiel** suspend l'accès par prudence. Le montant initial, la devise, le client et le paiement doivent correspondre.
- Un `charge.dispute.created` signé sur un PaymentIntent lié impose `status=unpaid` et `terminal=true`, sans prétendre qu'un remboursement a eu lieu. Un litige contesté ou gagné ne réactive pas automatiquement un droit : intervention humaine et nouvelle preuve séparée requises.
- Si l'incident arrive avant la facture payée, si la clé PaymentIntent est fausse, si le fournisseur est mauvais, ou si le hash signé ne correspond pas, **aucun compte n'est modifié**.
- Une table de reçus d'incident contient uniquement ID d'événement, type, SHA-256 des octets, ID PaymentIntent, ID souscription, outcome et horodatage. **Pas de charge ni de facture brutes en stockage**. Le registre global `xa_subscription_events` interdit un même identifiant sur deux familles d'événements.
- Les replays strictement identiques sont idempotents ; un ID repris avec d'autres octets ou un autre abonnement est refusé. Un abonnement bloqué ne peut pas être réactivé par une facture/notification `active` tardive.

## Barrière d'environnement

Le moteur reste `enabled=false` par défaut et n'a **aucune route HTTP publique**. Même si un appelant le configure `enabled=true`, il refuse les DSN distants ou les noms de base autres que **`xartists_billing_probe` sur `127.0.0.1` / `localhost`**. Un contrôle `SELECT current_database()` dans la transaction confirme encore le nom réel avant toute écriture. Le dépôt utilise seulement une base PostgreSQL 16 **éphémère** dans GitHub Actions.

Les scripts de migrations `20261113_xa_stripe_billing_reconcile_sandbox.sql` puis `20261113_xa_stripe_billing_incident_hold_sandbox.sql` doivent être appliqués **uniquement sur cette base jetable**. Aucun raccordement au Render DATABASE_URL ni aux projets Neon. Aucun privilège, secret ni paiement réel ne sera créé.

## Tests attendus

Les tests vérifient, sur PostgreSQL temporaire, signature HMAC et période d'une facture test, liaison PI unique, erreur sur PI inconnu, client Stripe étranger, montant invalide, remboursement partiel, litige, replays, événement d'annulation et retour tardif. Ils vérifient aussi qu'aucune table de grant xOrus n'est nécessaire et que les réponses annoncent toujours `grant_access=false`, `checkout_enabled=false` et `delivery_verified=false`.

## Préconditions pour la suite commerciale

1. Préparer une vraie base de production **identifiée et restaurable**, distincte de cette migration test-only.
2. Certifier un compte email sans wallet, un schéma de droits par plan et un Price Stripe **recurring** test, avec CGV/TVA clairement définies.
3. Ajouter le webhook HTTP test authentifié et ses retries opérationnels, le provisionnement serveur d'une liaison compte/client/Price, la **réconciliation contre l'API Stripe**, le traitement des refunds/disputes inconnus, événements hors ordre et remboursements créés avant la facture.
4. Associer ensuite un droit premium uniquement à une facture réellement réglée, à une licence fournisseur commerciale prouvée et à un rapport xOrus privé réellement livrable, avec quota et révocation démontrés.
5. Vérifier l'E2E Chrome + mobile xPortal où nécessaire, incidents, résiliation, remboursement et délivrance ; demander ensuite seulement l'autorisation d'activation `livemode`.

**Verdict : GO pour code de sécurité sandbox et tests déterministes, NO-GO pour abonnement réel, checkout, paiement, mint, trading et data commerciale non licenciée.**
