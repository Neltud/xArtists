# Bridge latency optimization

## Principe

La latence bridge **tue l’edge**. On n’optimise pas un bridge message lent : on **évite d’attendre**.

| Rang | Mode | Latence effective |
|------|------|-------------------|
| 1 | **INVENTORY_PREPOSITION** | ~0–0.3 s (déjà du stock sur la chaîne dest) |
| 2 | **FAST_CORRIDOR** (native_fast) | p50 ~8 s (SOL↔HL) |
| 3 | **msg_bridge_v0** | p50 ~45–60 s — souvent abort |

## Mécanismes

1. **Pénalité adaptive** — `latency_penalty_bps(p95)` remplace le fixe 80 bps quand l’inventaire ou une route rapide existe.  
2. **Edge decay abort** — si `net_edge - decay(p95) < 15 bps` ou `p95 > 90s` → pas d’intent.  
3. **Parallel prep** — build buy+sell txs en parallèle dès quotes lockées.  
4. **EWMA samples** — `record_sample()` affine p50/p95/reliability.  
5. **Inventory env** — `LIA_INV_MVX_USD`, `LIA_INV_SOL_USD`, `LIA_INV_HL_USD`.

## Config

| Env | Défaut | Rôle |
|-----|--------|------|
| `LIA_EDGE_DECAY_BPS_PER_SEC` | 0.8 | risque edge / seconde |
| `LIA_MAX_BRIDGE_LATENCY_SEC` | 90 | plafond |
| `LIA_TARGET_BRIDGE_LATENCY_SEC` | 12 | cible |
| `LIA_INV_*_USD` | 0 | pré-position |

## API

```python
from lia.bridge import BridgeLatencyOptimizer, InventoryBook

opt = BridgeLatencyOptimizer(inventory=InventoryBook(balances={"solana": 50}))
print(opt.best_route("multiversx", "solana", size_usd=25))
print(opt.plan_parallel_legs(
    buy_chain="multiversx", sell_chain="solana",
    size_usd=25, net_edge=0.02,
))
opt.record_sample("solana", "hyperliquid", "native_fast", 7.2, fee_bps=9)
```

## Sécurité

- Pas de bridge auto des fonds utilisateurs  
- PAPER par défaut  
- Routes `msg_bridge_v0` = experimental  
- RWA escrow bridge = flux séparé (`lia/rwa`), pas arb HFT  

## Tests

```bash
python -m lia.bridge.test_latency
```
