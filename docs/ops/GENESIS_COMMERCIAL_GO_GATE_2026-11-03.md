# Genesis checkout public — release gate opérateur (2026-11-03)

**État actuel : VITRINE GO, ACHAT/MINT NO-GO.** Ce document n'autorise aucun GO financier.

## Vitrine versus vente

- GitHub Pages et Render servent la vitrine publique ; **la disponibilité du site n'est pas celle du paiement**.
- Le bouton « Achat suspendu » est inactif par défaut, la modale de checkout n'est pas montée ; seul l'aperçu déclaré `sans paiement ni NFT` reste utilisable.
- Les montants visibles sont des indications de catalogue, **pas** un devis signé ni un prix on-chain confirmé. Ne pas déduire une livraison NFT des IPN PayBox, des caches navigateur ou du GitHub Actions HTTP 204.

## Quatre verrous indépendants

1. **GitHub Pages `VITE_GENESIS_COMMERCIAL_GO=1`** (variable GitHub Actions repository) : décision manuelle **explicite** ; défaut `0` dans `.github/workflows/static.yml`. Une variable Vite est publique et ne doit jamais contenir de secret.
2. **API health vérifié à l'instant d'afficher la modale** : `service=access-api`, `orders_backend=postgres`, `mint_live_enabled=true`, `mint_dry_run=false`. La route `/health` n'atteste ni la table mint_jobs ni une transaction financière.
3. **Fiat** : méthode PayBox disponible et `paybox_checkout_enabled=true`. Stripe reste interdit en l'absence d'un état live explicite côté API.
4. **Crypto** : configuration vérifiée du contrat `canBuyAgent()` en plus des étapes 1–2. Le simple fait de configurer une adresse ou un codeHash frontend n'est pas une preuve du fonctionnement du mint ; la transaction et le reçu on-chain doivent être revus.

Si l'un de ces prérequis manque ou si la requête échoue, **fail closed** : paiement indisponible. Rien de cela n'autorise un opérateur à inverser les drapeaux aujourd'hui.

## Avant une décision humaine GO commercial (interdits tant que non cochés)

- [ ] **#281** : base réellement liée à Render identifiée en privé ; `mint_jobs` et contraintes SQL prouvées, plan de sauvegarde et reprise d'incident, permissions minimales.
- [ ] PayBox S1 : paiement opérateur réellement signé, IPN RSA validé sur vraie transaction, idempotence multi-processus, collisions provider_tx et remboursements/revocations éprouvés.
- [ ] S2 : transaction mainnet finale, identité issuer/collection/nonce/buyer, codehash/roles vérifiés, un reçu NFT indépendant ; `delivery_verified` vrai seulement après cette preuve et commit SQL atomique.
- [ ] Éliminer la fenêtre micro-prix `setPackPrice` non atomique ; audit et catalogue server-side prix exact + devis, droits, conditions commerciales.
- [ ] **#328** : si le parcours retenu emploie claimPack, chain binding dans la VM ou protocole alternatif approuvé indépendamment avant **tout** testnet deploy, puis permission testnet humaine. Ce travail ne doit pas être confondu avec l'ancien SC marketplace.
- [ ] Revue sécurité externe, juridiques et procédures d'astreinte, contrôle régression mobile et xPortal, GO opérateur signé et daté.
- [ ] Indépendamment : LIA live trading, TRO bridge, certification IA et Studio upload restent désactivés.

## Rollback — les contrôles API demeurent prioritaires

Si incident : appliquer le kill switch API `PAYBOX_CHECKOUT_ENABLED=0`, `MINT_LIVE_ENABLED=0`, `MINT_DISPATCH_ENABLED=0`, conserver `MINT_DRY_RUN=1`. Retirer en parallèle la variable Pages `VITE_GENESIS_COMMERCIAL_GO` (ou la mettre à `0`) et reconstruire le frontend pour masquer la modale. Une modification Vite nécessite un redeploy, donc **ne pas se reposer uniquement sur le frontend pour stopper un paiement**.

Après rollback, prouver `/health` et tester l'absence de nouvelle session et de nouveau mint ; traiter les commandes antérieures par la procédure de remboursement/réconciliation.

## Preuve du jour

- PR [#335](https://github.com/Neltud/xArtists/pull/335) a publié le contrôle SQL en lecture seule `/v1/ops/mint-jobs-store/status` sur Render ; observation **HTTP 503**, pas de validation `mint_jobs`.
- PR [#336](https://github.com/Neltud/xArtists/pull/336) livre ce garde-fou UX ; le GO commercial n'est pas activé.
- La PR #334 est un codec V2 **offline**, non un contrat de production ni une autorisation d'émettre.

**Ne jamais placer de seed, PEM, PAT, `DATABASE_URL`, clé d'émetteur ou données client dans GitHub Issues, Render logs ou ChatGPT.**
