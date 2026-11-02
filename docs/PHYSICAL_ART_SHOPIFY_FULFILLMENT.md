# xArtists — Œuvres physiques, NFT, Shopify, livraison et réception

**Architecture V1 · 2 novembre 2026 · feature flag OFF par défaut · aucun colis réel prouvé.**

Le Creator Studio mint mainnet appartient au wallet personnel de l'artiste. Le nouveau module Shopify gère une chaîne de garde distincte. **Commande payée, colis expédié, livraison transporteur, réception acceptée par l'acheteur, possession d'un NFT et transfert légal de propriété sont des faits différents.**

## État actuel

- DApp V3 : /studio (signature personnelle du premier NFT) et /rwa (certification paper, catalogue et suivi de l'œuvre).
- PR créateur #268 fusionnée, tests automatisés verts. Premier NFT réellement minté par un artiste volontaire : preuve TxHash encore attendue.
- Boutique connectée : g2vj0e-10.myshopify.com (France, EUR), **Shopify trial** ; aucun produit d'œuvre physique correspondant. Offre payante nécessaire avant vente.
- API xArtists : Node 20+ sur Render selon le dépôt ; PostgreSQL possible avec DATABASE_URL.
- Nouveau registre : backend, tests, UI ; **inactif tant que Shopify, PostgreSQL et secrets ne sont pas configurés**.
- Vercel : aucun projet xArtists trouvé. Render : sélection du workspace nécessaire et non autorisée ici.

## Parcours de vente et de réception

1. Artiste : wallet xPortal et message SIWX signé, puis enregistrement de la fiche d'œuvre (titre, technique et photo d'origine). Le navigateur calcule le SHA-256 et transmet **seulement l'empreinte**. Le fichier original reste chez l'artiste.
2. Le serveur génère un identifiant xa_phy_... et un SKU Shopify XAPHY-... uniques. Un NFT peut être déclaré ; son lien est **non vérifié** initialement.
3. Si un NFT est renseigné, l'artiste peut déclencher une vérification **lecture seule** sur api.multiversx.com : le token doit correspondre, avoir été créé par l'artiste et se trouver dans son wallet. **Ce contrôle n'atteste pas** la propriété du tableau physique, l'authenticité historique ni des droits intellectuels.
4. Un marchand autorisé peut préparer un produit **en brouillon**, au SKU exact, avec quantité 1, expédition/assurance/TVA/emballage. Prix, taxes, description et publication restent à valider par l'artiste et le marchand ; aucun produit n'est créé automatiquement.
5. Shopify envoie orders/paid signé. Seule une commande réellement payée, non annulée et non remboursée, contenant le SKU exact en quantité 1, devient ORDER_PAID.
6. Shopify envoie fulfillments/create et fulfillments/update signés. Seuls in_transit et out_for_delivery signifient SHIPPED ; delivered signifie **CARRIER_DELIVERED**. Les étiquettes achetées et le statut de fulfillment success ne prouvent ni envoi ni livraison.
7. Le marchand vérifie **hors bande** le wallet de l'acheteur correspondant à la commande et l'associe via endpoint admin privé. Une note de commande Shopify ou un champ utilisateur ne constitue pas une preuve d'identité wallet.
8. Le détenteur de ce wallet signe une session et confirme la réception après livraison transporteur, avec photo d'état dont l'empreinte est conservée ; ou ouvre un litige dommage/non-réception. Le serveur n'accepte jamais BUYER_ACCEPTED sans CARRIER_DELIVERED.
9. Artiste ou acheteur peuvent ouvrir une **demande de réévaluation** motivée avec empreinte photo. Le système produit un triage **déterministe** (contrôles suggérés, risque, revue humaine pending_human). Un vrai modèle multimodal et l'expertise humaine sont un chantier ultérieur, pas une expertise IA active.
10. **Aucun** webhook, certificat ou avis ne déclenche automatiquement règlement, transfert d'EGLD, remboursement, mint NFT, transfert de propriété ou escrowing.

## Configuration serveur (secret, ne jamais exposer en VITE_)

| Variable | Objet |
|---|---|
| PHYSICAL_FULFILLMENT_ENABLED=1 | Gate opt-in après validations |
| SHOPIFY_SHOP_DOMAIN=g2vj0e-10.myshopify.com | Nom de boutique exact à comparer |
| SHOPIFY_WEBHOOK_SECRET | Client secret de l'app Shopify, requis pour HMAC SHA256 |
| PHYSICAL_ADMIN_TOKEN | Secret opérateur aléatoire d'au moins 32 caractères, jamais dans le frontend |
| DATABASE_URL | PostgreSQL durable obligatoire : mode sans DB refuse l'opération |
| ACCESS_JWT_SECRET | JWT signé sur le serveur, session 15 minutes avec purpose=physical_art |
| CORS_ORIGIN=https://neltud.github.io | Origine de la dApp |

**Webhook cible après vérification du service hébergé** : https://xartists-access-api.onrender.com/v1/webhooks/shopify/physical (ne pas supposer que le serveur est effectivement configuré). Créer dans Shopify l'app et les abonnements HTTPS orders/paid, orders/cancelled, refunds/create, fulfillments/create, fulfillments/update. Contrôler scopes, version API, client secret, domaine et delivery ID. Le backend compare le **corps brut** par HMAC-SHA256 en temps constant, restreint le topic et déduplique dans PostgreSQL en utilisant X-Shopify-Webhook-Id.

Docs officielles : https://shopify.dev/docs/apps/build/webhooks/verify-deliveries · https://shopify.dev/docs/api/admin-rest/latest/resources/fulfillment · https://docs.multiversx.com/sdk-and-tools/rest-api/multiversx-api/

## Endpoints privés (Access API)

| Endpoint | Autorisation |
|---|---|
| GET /v1/physical/config | Public, statut sans secrets |
| POST /v1/physical/challenge | Challenge portefeuille (message orienté RWA) |
| POST /v1/physical/session | SIWX valide, JWT 15 min et purpose=physical_art |
| POST /v1/physical/works | JWT artiste ; nouveau registre / SKU |
| GET /v1/physical/works/:id | JWT artiste ou buyer lié |
| POST /v1/physical/works/:id/verify-nft | JWT artiste ; NFT détenu et créé par lui selon indexeur mainnet |
| POST /v1/webhooks/shopify/physical | HMAC Shopify, shop allowlist, topic allowlist, idempotence |
| POST /v1/physical/works/:id/bind-buyer | Authorization: Admin (secret opérateur backend) |
| POST /v1/physical/works/:id/receipt | JWT acheteur lié, décision et photo SHA-256 |
| POST /v1/physical/works/:id/reassess | JWT artiste/acheteur, requête de contrôle humain |

Le journal d'événements est chaîné par SHA-256 pour vérifier sa cohérence mais **n'est pas notarialisé** on-chain : un administrateur de base de données pourrait le modifier. Aucune photo, adresse postale, courriel ou payload Shopify brut n'est persisté dans la fiche ; les numéros de suivi et adresses wallet restent privés des seules parties autorisées. Les originaux photo doivent être conservés pour réexamen.

## Release gates

1. Tests API : dans services/access-api, lancer npm ci --ignore-scripts, puis npm test. Tests : HMAC brut, mauvais domaines/sujets, JWT purpose, factures impayées/remboursées, statuts transporteur, acheteur lié, réception avec empreinte, litige, réévaluation, NFT.
2. Tests frontend : dans apps/frontend, npm ci --legacy-peer-deps, npm run typecheck, npm run build, mobile 390×844 et desktop.
3. Monter un PostgreSQL durable, les secrets dans Render, le backend adéquat et les abonnements Shopify. Documenter les droits de l'app, les expirations et les procédures de rotation de secrets. Ne pas confondre configuration avec vente live.
4. En recette : tester de **vrais webhooks Shopify** sur produits brouillons et commandes de test, une livraison simulée non payée, un webhook signé valide puis rejoué, un HMAC faux, un SKU erroné et une indisponibilité PostgreSQL.
5. En production : valider une transaction NFT artisan réellement signée, une première commande physique et l'ensemble expédition/réception avec preuves indépendantes et conservation des photos.
6. Avant toute activation commerciale : conformité TVA/expéditions et assurances, RGPD (rétention, effacement, accès), politique de litige, publication de politique de retour, revue des contrats escrow, monitoring et rapprochement Shopify.

**Shopify actuellement trial** : les pages d'œuvres physiques peuvent être préparées et leur SKU vérifié, mais les ventes ne doivent pas être annoncées comme live.

## Futures extensions

- **AWS** : stockage privé S3 chiffré des preuves, liens signés courts, SQS/EventBridge + file d'erreurs et IAM minimal, avec consentement des ayants droit et politique de rétention.
- **IA multimodale** : comparer photo avant/après, suggérer anomalie de condition et niveau d'incertitude, ne jamais conclure automatiquement au prix, à l'authenticité ou à la remise d'une œuvre ; évaluation indépendante humaine.
- **MoonPay** : on-ramp volontaire, hors parcours Shopify et sans déclencher une vente ou un transfert NFT.
- **AMD** : optimisation de l'inférence seulement si un hôte AMD Instinct réel, un modèle et un budget sont disponibles.

**Correctif anti-régression paiement :** une annulation ou un remboursement Shopify signé **après** un événement paid ouvre un statut DISPUTED/pending_human ; la réception ne peut plus être considérée comme acceptée ni aucun fonds libéré automatiquement.
