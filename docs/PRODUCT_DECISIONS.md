# Décisions produit (2026-08-03)

## SC ownership

- **Owner après deploy = wallet LIA** (`erd1p4zyy…lerqu0crn6`)
- `claimFees` → treasury LIA
- 2-step ownership conservé pour migration future éventuelle vers multisig (P2)

## Buy agent → livrable acheteur

Après `buyAgentAction` réussi (event on-chain) :

1. **Clé API limitée** (scope agent_id, rate-limit, révocable)
2. **NFT badge** (preuve d’achat / accès) — mint minter SC ou collection dédiée
3. **Reçu** (JSON + lien explorer tx) dans UI + email/webhook optionnel

Pipeline Vellum : watch buy events → provision API key → mint badge → write `data/agent_purchases/{tx}.json`

## Marketplace SC address

- Adresse dans `contracts.json` = **projet xArtists** (historique multi-outils)
- **Action obligatoire** : vérifier codehash explorer vs wasm repo avant d’annoncer Bid live

## $TRO burn (business model optimisé)

Recommandation retenue :

| Paramètre | Valeur |
|-----------|--------|
| Source | **Pris sur la fee marketplace** (pas un surcoût buyer) |
| Split fee 3 % (300 bps) | **200 bps treasury LIA** + **100 bps burn $TRO** (si payment/path TRO) |
| EGLD-only sales | Accumuler EGLD fee ; burn TRO périodique depuis treasury (buy & burn) |
| Buyer | Paie uniquement le prix listé (UX simple) |

Implémentation SC : upgrade `buyNft` / `buyAgent` pour path TRO ; sinon ops burn off-cycle.

## Phygital lock

- **Phase 1 (maintenant)** : flag metadata `phygital_locked` / `physical_status` — **n’empêche pas** buy on-chain
- **Phase 2** : endpoint ou require `!physical_locked` si escrow physique activé
- Raison : ne pas bloquer liquidité NFT tant que process logistique n’est pas outillé

## Pipeline Pages

- **Un seul pipeline** capitalisé : `deploy-pages.yml` (build → docs/ → Pages)
- Désactiver / ne plus utiliser les workflows Pages redondants quand possible

## LIA seller

- LIA **peut** `listAgentAction` et lister ses NFT (seller = LIA)
- FE : badge « Official LIA » si seller == LIA_WALLET
