# xArtists — rapprochement des abonnements Stripe avec un compte (SANDBOX)

**13 novembre 2026 · préproduction uniquement, sans Checkout live ni livraison premium.**

## Livrables exacts

- `services/access-api/src/stripeBillingReconcile.mjs` : valide une signature Stripe **test**, une liaison compte/client/souscription/Price **provisionnée côté PostgreSQL**, la facture mensuelle EUR et ses dates. Une écriture transactionnelle stocke le reçu SHA-256 et le statut d'abonnement ; un événement dupliqué ne modifie rien.
- `services/access-api/migrations/20261113_xa_stripe_billing_reconcile_sandbox.sql` : migration **additive** sur la base contenant déjà `xa_user_accounts` et `xa_fiat_subscriptions`. Une table de liaison limite la tarification test aux trois objectifs 379/579/979 centimes EUR/mois. Une table de reçus immuables garde les identifiants d'événements et hash des octets, jamais le JSON des factures ou les données privées.
- `services/access-api/tests/stripeBillingReconcilePostgres.test.mjs` : vraies transactions PostgreSQL 16 sur base jetable, avec webhooks **entièrement synthétiques**, HMAC fixture locale, replay, mauvaise signature, mauvais Price, refus si période de service absente, facture échouée, livraison hors ordre et annulation terminale.
- `.github/workflows/stripe-billing-sandbox-ledger-ci.yml` : exécute la suite sur un conteneur `postgres:16` éphémère. Aucun appel à Stripe et aucun secret/projet Neon/Render.

## Limites explicites du périmètre

**Cette PR ne possède aucune route HTTP de paiement ni de webhook et ne traite aucune transaction réelle.** Le service est désactivé par défaut : l'appelant doit passer explicitement `enabled: true` dans son propre **processus de test**, avec pool vers base jetable. Aucune configuration d'environnement de Render n'est ajoutée.

**Aucune création de client, aucun compte email OTP réel, aucun tarif Stripe récurrent, aucun Checkout ou prélèvement, aucune émission de droits, aucun rapport privé vendu, aucun NFT ou wallet et aucun trade.** Le service ne touche pas aux tables `xa_xorus_grants`, `xa_xorus_private_reports`, `mint_jobs` ni `paybox_orders`. Un statut `active` dans ce **registre de test** n'est pas un droit d'accès.

La table `xa_stripe_billing_bindings` doit être provisionnée plus tard par un service d'onboarding séparé et certifié, **jamais depuis une adresse email, un jeton de navigateur ou des métadonnées Stripe non corroborées**. Le code rejette les abonnements non liés à un compte existant et non désactivé.

**Annulations et mauvais paiement :** un événement signé `customer.subscription.deleted` rend le statut `canceled` terminal même si l'événement est arrivé en retard. Une facture signée `invoice.payment_failed` fait passer au statut `past_due`. Un événement `customer.subscription.updated` affichant seulement `active` ne crée aucun accès ni statut payé.

**Blocage important :** le rapprochement des remboursements Stripe par `charge.refunded` et des litiges n'est pas encore développé dans cette PR. Un système réellement payant doit traiter ces événements et supprimer automatiquement les droits éventuels. En attendant, aucun usage commercial de ce module n'est autorisé.

## Ordre de mise en service des abonnements réels

1. Identifier le `DATABASE_URL` réellement raccordé à l'API Render, sauvegarder et vérifier une restauration ; ne pas appliquer ces migrations sur une base inconnue.
2. Authentifier les comptes email OTP réels et obtenir l'identifiant interne du compte depuis la vérification JWT serveur.
3. Définir les prestations par niveau, les CGV, la TVA et l'annulation. Créer des produits/prix Stripe **en mode test** ; vérifier que le Price fait correspondre univoquement compte, plan et montant.
4. Ajouter le provisionnement serveur atomique de la liaison account/customer/subscription/Price, avec anti-double rattachement et contrôle de propriété.
5. Exposer un webhook signé **en mode test uniquement**, rejeter 4xx/5xx de façon cohérente, traiter `invoice.paid`, échecs, résiliations, remboursements, litiges et événements arrivant hors ordre.
6. Relier une souscription payée/valide et non remboursée aux droits xOrus sous quota atomique **seulement lorsque les licences des sources et le rapport dérivé privé sont certifiés**.
7. Réaliser un E2E réel en **test mode** : compte email → prix Stripe récurrent test → Checkout test → événement signé → ledger → rapport privé → résiliation/refund → accès révoqué. Vérifier l'isolation intercomptes et le rollback.
8. Seulement après autorisation commerciale explicite, ouvrir progressivement `livemode` et mettre en place une surveillance temps réel.

## Verdict

- SQL/PostgreSQL local, signature synthétique et contrôle de replay : **testable / indépendant de la production**.
- Paiement et abonnement xArtists facturables : **NO-GO**.
- Licence Binance/Artprice/CoinGecko et données indépendamment vérifiées : **NON ATTESTÉES**.
- xOrus : **paper, ABSTAIN, aucun droit premium créé**.

Issue de suivi : [#548](https://github.com/Neltud/xArtists/issues/548), [#465](https://github.com/Neltud/xArtists/issues/465).
