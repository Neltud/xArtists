# LIA Trading Stack — multi-chain · leviers · TP sécurisé

## Ordre d’exécution (inviolable)

```
DEFENSE / mode
    → Venue + leverage policy (chain)
        → Guardian spiral / equity floor
            → Fee/gas micro-skip
                → Secure TP open (log|exp|ladder|fixed)
                    → ticks: trail + partials + profit lock
```

`LIA_LIVE_TRADING=0` ⇒ tout en **PAPER** (sauf lecture signaux).

## Leviers par chaîne

| Chain | Live max | Paper max | Notes |
|-------|----------|-----------|--------|
| **MultiversX** | 1.5× | 2.0× | Spot, LP, Hatom loop ≤ ~1.8× HF-safe |
| **Solana** | 1.5× | 20× | Jupiter ; high lev paper only |
| **Hyperliquid** | 1.5× | 20× | Perps paper ; live high lev **blocked** |
| **Soul** | 1.0× | 1.0× | Experimental / signals |

## Protocoles / venues

| Venue | Chain | Rôles | Live? |
|-------|-------|-------|-------|
| xExchange / OneDex / AshSwap | MVX | swap, micro-arb | partial |
| Hatom | MVX | yield, loop | partial |
| xMEX | MVX | weekly compound | via routes |
| XOXNO | MVX | NFT external | partial |
| Jupiter | SOL | routes | planned / signals |
| Hyperliquid | HL | perps hedge | planned / paper |
| Soul | multi | restake | experimental |

## Take-profit sécurisé

| Couche | Rôle |
|--------|------|
| **TpPlan** `log` (défaut) | Scale-out progressif g_min→g_max |
| **Trailing hybrid** | HWM + BE + step tighten |
| **min_net_edge** | Skip partial si net < fees |
| **lock_ratio 70 %** | Gains réalisés non re-risqués |
| **Guardian lockdown** | Spiral → compoundable → locked |

### Modes TP

- `fixed` — 1 niveau  
- `log` — densifie tôt, runner  
- `exp` — niveaux espacés φ  
- `ladder` — multiples de R  

## API Vellum

```python
from lia.circuit.trading_stack import TradingStack

stack = TradingStack()
st = stack.propose_entry(
    strategy="MOMENTUM", chain="multiversx", token="EGLD",
    entry=25.0, size_usd=15.0, equity_usd=100.0,
    expected_gross=0.02, tp_mode="log",
)
# ticks
stack.on_price(st["id"], 25.4)
print(stack.status()["ledger"])  # locked vs compoundable
```

```python
from lia.risk.leverage_policy import allow_execution, policy_snapshot
allow_execution(chain="solana", venue_id="jupiter", requested_leverage=10, strategy="MOMENTUM")
```

## Tests

```bash
python -m lia.risk.test_secure_tp
```

## Règles produit

1. Guardian **before** Brain  
2. Pas de live SOL/HL > 1.5×  
3. Profit lock ≥ 70 % des nets partiels  
4. Micro-trade skip si edge < fees+gas  
5. DEFENSE = zéro nouvel entry  
