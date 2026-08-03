# LIA UniversalExecutor

## Modes

| Mode | Condition |
|------|-----------|
| **paper** | default (`LIA_LIVE_TRADING=0`) |
| **live** | `LIA_LIVE_TRADING=1` **and** valid `PEM` / `LIA_WALLET_PEM_PATH` |
| **halted** | ≥3 consecutive live failures |

## Usage

```bash
python -m lia.executor.universal          # health + paper sample
export LIA_LIVE_TRADING=0
# never commit PEM
```

## Safety

- MAINNET only (`CHAIN=1`) on live path
- Risk limits from `lia.board.risk` (48/day, 6/hour)
- Circuit breaker → Telegram ops should alert on `halted`
- Frontend never sees PEM

## Wire from Vellum

After signal → build `TxIntent` → `executor.execute(intent)` → append trade JSON if ok.
