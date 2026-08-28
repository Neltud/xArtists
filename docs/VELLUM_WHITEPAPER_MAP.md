# Vellum.ia White Paper → xArtists / repo mapping

Source concept: *WHITE PAPER VELLUM.IA v1.0* (Master Blueprint).

Vision: abstraction de la complexité blockchain par l’IA (LIA).

## Piliers → implémentation

| Pilier WP | Dans le repo / dApp | État |
|-----------|---------------------|------|
| **A. Interface neuronale LIA & Command Bar** | `IntentBar` ⌘K · `intentParser` · Vellum brain paper | UI live · exécution paper |
| **B. Fiat on-ramp** | `FiatOnRampModal` · `MoonpayButton` · Express options | Demo + redirect MoonPay |
| **C. Liquidity Orchestrator** | `lia/liquidity/orchestrator.py` · `LiquidityPanel` | Paper only |
| **D. Relayer / gasless** | Non déployé — future (relayer MVX / meta-tx) | Roadmap |
| **Circuit breaker** | RiskManager · `risk_manager_state.json` · SC pause pattern | Paper + docs |
| **Tiered vaults MPC** | Mission / Reserve wallets (à créer) · policy treasury | Partial |
| **Guardian AI** | Guardian panels · policy engine paths | Paper |
| **$TRO** | Token TRO-94c925 · DAO · utility pages | Live read |
| **Lightning agent wallet** | MCP `lightning-wallet-mcp` · `/agents/lightning` | Ops optional |

## Produits clarifiés (2026-08-28)

| Produit | Nature |
|---------|--------|
| Packs IA | **Pulse · Yield · Sentinel** uniquement (NFT access Model C) |
| **Tours artistiques** | Service culturel : visites, expos, itinéraires art — **pas** un pack agent IA |
| Board LIA | Paper trading / fusion signaux |
| Lightning | Wallet BTC pour **agent ops** (Vellum), pas pour l’utilisateur dApp MVX |

## Friction Gap → réponse xArtists

1. Fiat → on-ramp UI  
2. UX technique → Intent / LIA  
3. Liquidité multi-chain → orchestrator paper → live après bridge health  

## Sécurité WP

Ne pas promettre MPC/cold en prod tant que non déployé. Circuit breaker = RiskManager + gates codeHash.
