---
hidden: true
noIndex: true
---

# Packs Genesis — catalogue de référence (non commercialement ouvert)

> **État vérifié le 4 novembre 2026 : catalogue Stripe créé, checkout public fermé, aucun mint ni livraison NFT attestés.**
> Ce document interne remplace l'ancien tableau à 18 / 12 / 8 €, devenu obsolète. Ne pas utiliser les anciennes valeurs pour un devis, une communication commerciale ou un paiement.

## Packs et prix catalogue

| Pack | Tier | Offre affichée | Édition maximale proposée | Stripe Product ID |
| --- | --- | ---: | ---: | --- |
| Pulse | GOLD | **110 €** | 333 | `xartists_pack_pulse_v1` |
| Yield | SILVER | **75 €** | 500 | `xartists_pack_yield_v1` |
| Sentinel | PLATINUM | **50 €** | 777 | `xartists_pack_sentinel_v1` |

- Les prix Stripe sont **EUR / one-time**, et non des abonnements. Ces montants sont le catalogue de référence ; aucun paiement n'est autorisé tant que les critères d'ouverture ne sont pas remplis.
- Les trois produits existent sur le compte Stripe live **Nelsonprods**, avec un prix par défaut vérifié (voir `ops/evidence/public-route-stripe-audit-2026-11-04.json` dans la PR #384). Métadonnées produits : `release_status=checkout_closed`.
- Les montants EGLD affichés côté dApp sont des estimations et **pas** des devis exécutables. L'autorité de prix de chaque paiement futur doit rester côté serveur.
- L'abonnement **TCA / Whop est un produit distinct** : ni abonnement Genesis, ni NFT Genesis inclus par défaut.

## Navigation de référence

1. Consulter `/intelligence/agents` ou `/packs` pour découvrir le catalogue.
2. Ouvrir `/packs/pulse`, `/packs/yield` ou `/packs/sentinel` pour les fiches détaillées.
3. Consulter `/workspace/agents` (`/my-packs`) pour les actifs réellement vérifiés.
4. Tant que le commerce reste fermé, utiliser uniquement l'aperçu ou la simulation **PAPER**, explicitement sans paiement, NFT ni droits accordés.

Les anciennes URL `/#/agents` et `/#/my-packs` sont des liens historiques, pas les URL canoniques de la dApp BrowserRouter. Vérifier les entrées HTML directes lors du déploiement GitHub Pages (issue #362).

## Séparation des preuves et des droits

- Une sélection de pack, un aperçu, une simulation LIA, un produit Stripe ou un redirect Checkout ne prouvent **ni paiement vérifié, ni mint, ni accès**.
- Le paiement doit être corrélé à un événement PSP signé, dédupliqué et journalisé de manière durable, avant toute livraison.
- Un SFT d'entitlement Genesis ne se confond ni avec un NFT d'artiste, ni avec une œuvre physique, ni avec un transfert légal de propriété matérielle.
- Une confirmation de livraison requiert des preuves on-chain (transaction, identifiant NFT, bénéficiaire correct) et une réconciliation persistante ; ne jamais publier `delivered_at` sur la seule réception d'un signal de paiement.
- Aucun rendement financier, APY ni trading exécuté ne sont promis.

## État de disponibilité et gates

La lecture publique `/health` du 4 novembre confirme : `stripe_configured=false`, `paybox_checkout_enabled=false`, `mint_live_enabled=false`, `mint_dry_run=true`, `lia_live_trading=0`. Le statut du stockage `mint_jobs` reste HTTP 503 ; sa cause n'est pas établie.

**Ne pas activer de paiement, webhook de production, mint, trading, auction, bridge ou token sale à partir de cette mise à jour documentaire.** La réouverture dépend des preuves de publication (#362), de paiement/livraison et remboursement S1/S2 (#281), d'une revue de sécurité indépendante et d'un GO opérateur séparé.

## Sources de vérité à maintenir alignées

- `apps/frontend/src/config/agentPacks.ts`
- `docs/GENESIS_PACK_EDITIONS.md`
- `services/access_pack/catalog.py` (autorité serveur de devis ; vérifier l'intégration avant toute vente)
- `ops/evidence/public-route-stripe-audit-2026-11-04.json` (branche PR #384)
- PR #383 : sandbox Stripe isolé et **test-only**, non activé publiquement
