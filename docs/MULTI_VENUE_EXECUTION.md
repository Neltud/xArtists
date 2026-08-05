# Multi-Venue Execution — Solana (Jupiter) + Hyperliquid + MultiversX

LIA peut router les ordres vers **trois venues** depuis Vellum.

## Architecture

```
StatArbBrain / UniversalBrain / signal_hub
        ↓ actions[]
MultiVenueExecutor (nodes/multi_venue_executor.py)
        ├── venue=mvx        → UniversalExecutor (MultiversX)
        ├── venue=jupiter    → JupiterAggregator (Solana)
        └── venue=hyperliquid→ Hyperliquid perps/spot
```

## Fichiers

| Path | Rôle |
|------|------|
| `lia/executor/jupiter_solana.py` | Quote + swap Jupiter v6 |
| `lia/executor/hyperliquid_exec.py` | Info + place order HL |
| `lia/executor/multi_venue.py` | Router unifié |
| `nodes/multi_venue_executor.py` | Nœud Vellum multi-venue |
| `nodes/jupiter_executor.py` | Nœud Vellum Solana only |
| `nodes/hyperliquid_executor.py` | Nœud Vellum HL only |

## Modes

| Mode | Comportement |
|------|----------------|
| `paper` (défaut) | Quotes / ordres simulés, **aucun** broadcast |
| `live` | Broadcast réel si env flags + clés configurés |

## Variables d'environnement

### Solana / Jupiter
```bash
LIA_SOL_LIVE=0
LIA_SOL_KEYPAIR_PATH=/secure/solana-keypair.json
LIA_SOL_RPC=https://api.mainnet-beta.solana.com
LIA_JUPITER_QUOTE_API=https://quote-api.jup.ag/v6
LIA_JUPITER_SLIPPAGE_BPS=50
```

### Hyperliquid
```bash
LIA_HL_LIVE=0
LIA_HL_PRIVATE_KEY=0x...
LIA_HL_ACCOUNT_ADDRESS=0x...   # si API wallet
LIA_HL_TESTNET=0
LIA_HL_BASE_URL=https://api.hyperliquid.xyz
```

### MultiversX (existant)
```bash
LIA_LIVE_TRADING=0
LIA_WALLET_PEM_PATH=/secure/wallet.pem
```

**Ne jamais committer de clés.**

## Dépendances live

```bash
# Solana
pip install solders solana

# Hyperliquid
pip install hyperliquid-python-sdk eth-account
```

Paper mode ne nécessite **aucune** de ces libs.

## Exemples d'actions

```python
# Jupiter: buy SOL with USDC
{"type": "BUY_SOL", "venue": "jupiter", "side": "buy", "amount_usd": 25, "strategy": "STATARB"}

# Jupiter: explicit mints
{"venue": "jupiter", "input_mint": "USDC", "output_mint": "SOL", "amount": 25_000_000}

# Hyperliquid: long BTC
{"type": "HL_LONG_BTC", "venue": "hyperliquid", "size": 0.001, "order_type": "limit"}

# Hyperliquid: size from USD
{"venue": "hyperliquid", "coin": "ETH", "side": "buy", "amount_usd": 100}
```

## Vellum wiring

1. Brain → `actions`
2. `MultiVenueExecutorNode(force_mode="paper", actions=...)`
3. PerformanceTracker / guards inchangés
4. Passer `force_mode="live"` seulement après tests paper + clés en secret store

## Sécurité

- Circuit breaker 5 fails → pause 5 min (par venue)
- Slippage Jupiter configurable (bps)
- HL: prefer limit + reduce_only pour closes
- LIA guards (G01–G20) restent en amont du router

---
*LIA v6+ multi-venue — xArtists*
