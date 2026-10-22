# Access API — MoonPay et paiements des packs xArtists

Backend minimal pour les parcours **1 (Stripe)** et **3 (Paybox)**.
Secrets **uniquement ici**, jamais dans le front GitHub Pages.

## Endpoints

| Method | Path | Rôle |
|--------|------|------|
| `POST` | `/moonpay/sign` | Signature serveur MoonPay EGLD ; aucun achat exécuté |
| `GET` | `/health` | Disponibilité de configuration, sans valeur de secret |
| `POST` | `/v1/checkout/session` | Node : 501 (Stripe SDK non intégré) ; Python : session Stripe si configuré |
| `POST` | `/v1/checkout/paybox` | 501 tant que signature HMAC et IPN vérifiée ne sont pas intégrées |
| `POST` | `/v1/checkout/paybox/ipn` | Non implémenté — ne jamais délivrer de NFT sur un retour navigateur |
| `GET`  | `/v1/checkout/status/:sessionId` | Python seulement : statut du reçu (non authentifié, à protéger) |

## Env serveur

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYBOX_SITE=...
PAYBOX_RANG=...
PAYBOX_HMAC_KEY=...
PAYBOX_ENV=preprod   # or prod
CORS_ORIGIN=https://neltud.github.io
```

## Front (GitHub Pages build secrets / env)

```bash
VITE_ACCESS_API_BASE=https://access-api.example.com
# optionnel : Stripe Payment Links seulement après preuve de liaison au wallet
VITE_STRIPE_PAYMENT_LINK_PULSE=...
# Paybox désactivé jusqu'au backend HMAC + IPN + mint
VITE_PAYBOX_ENABLED=false
```

## Flux

1. User choisit pack + Stripe ou Paybox dans `PackCheckout`.
2. Front `POST` session avec `pack_id`, `buyer_address` (erd1), **sans montant client**.
3. Le serveur choisit le prix et crée une session signée (non implémenté dans le serveur Node actuel).
4. Webhook / IPN **authentifié, idempotent et vérifié** → enregistre paiement → queue mint ; le minter live reste à implémenter.
5. Aucun paiement réel ne doit être activé avant tests d'intégration et preuve de livraison NFT.

Voir aussi `docs/PAYBOX_INTEGRATION.md`.

## MoonPay EGLD

Le serveur Node expose POST `/moonpay/sign` avec un corps JSON `{ "url": "…" }`.
Configurer `MOONPAY_PUBLIC_KEY`, `MOONPAY_SECRET_KEY` (même mode test/live),
`MOONPAY_RETURN_URL` et `CORS_ORIGIN` selon `.env.example`. Le front utilise
`VITE_MOONPAY_API_KEY` et `VITE_ACCESS_API_BASE`. Les clés secrètes restent serveur.
Le signataire valide le domaine MoonPay, les paramètres autorisés, le compte
public marchand et l’URL de retour ; il ne valide pas un paiement.

Tests locaux sans paiement :

```sh
node --test services/access-api/tests/*.test.mjs
```

Le PayBox crypto de `lia/executor/paybox_router.py` est un adaptateur distinct
pour Solana/EVM, sans connecteur externe implémenté ici. L’état de release complet
est détaillé dans `docs/RELEASE_AUDIT_2026-10-21.md`.

## Accès signé TCA

Installer avec `npm ci --ignore-scripts` dans ce dossier, lancer avec `npm start`,
et tester avec `npm test` (Node 20 ou ultérieur). Le SDK-core 13.17.2 est verrouillé.
Le challenge est lié au wallet et au texte exact, expire après cinq minutes et
n'est utilisable qu'une fois. Le client signe un objet SDK `Message` ; le serveur
vérifie la signature du message préparé par `MessageComputer`. Le checksum de
l'adresse est vérifié. Une erreur de signature ne consomme pas le challenge.

`REQUIRE_SIWX=1` est la valeur par défaut. Même avec le mode facultatif
`REQUIRE_SIWX=0`, un JWT FULL exige un challenge signé valide. Les JWT expirés,
sans expiration ou avec un MAC incorrect sont rejetés. Le test sur appareil
xPortal réel reste une validation distincte des tests logiciels.
