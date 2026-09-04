# Page Analyse `/market`

## Sprint A
- Fear & Greed, 8 assets, régime, news, brief LIA public

## Sprint B — Corrélation
- Matrice Pearson 7j (BTC ETH SOL XRP) via CoinGecko `market_chart`
- Affichage heatmap ; disclaimer corrélation ≠ causalité

## Sprint C — Funding
- Dernier funding rate Binance USDT-M (BTC ETH SOL) + fallback

## Sprint D — Board Vellum (public)
- Agrégats uniquement (régime, paire corr max, events haute sévérité, politique allocation)
- Modèle Vellum réel reste hors front

## Sprint E — Events
- Tagging headlines : legal, delist, halt, macro, protocol

## LIA trésorerie
- Wallet : `LIA_WALLET` (`links.ts`)
- **Seuil : ≥ 10 USDC** (`MIN_USDC_DEPLOY`) avant intention de placement
- Ordre : MultiversX → Solana → Soul Protocol ($SO lend/stake)
- Lecture solde USDC-c76f1f via API MultiversX (affichage seulement)

## Soul Protocol
- Config `apps/frontend/src/config/soulProtocol.ts`
- X : [@0xSoulProtocol](https://x.com/0xSoulProtocol) — omnichain liquidity / lending
- 2026-09 : private mainnet done, public approaching, $SO tokenomics publiques, **pas de TX live** jusqu’adresses mainnet figées
