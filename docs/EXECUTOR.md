# LIA UniversalExecutor

## Modes

| Mode | Condition |
|------|-----------|
| **paper** | default (`LIA_LIVE_TRADING=0`) or `force_mode=paper` |
| **live** | `LIA_LIVE_TRADING=1` **and** valid PEM |
| **halted** | ≥3 consecutive live failures |

**`force_mode=auto` does not mean live.** See `lia/executor/mode.py`.

## Usage

```bash
python -m lia.executor.universal          # health + paper sample
python -c "from lia.executor.mode import mode_report; print(mode_report('auto'))"
export LIA_LIVE_TRADING=0
# never commit PEM
```

## Safety

- MAINNET only (`CHAIN=1`) on live path
- Risk limits from `lia.board.risk`
- Circuit breaker → halt
- Frontend never sees PEM

## Wire from board / Vellum

Signal → `TxIntent` → `UniversalExecutor.execute(intent)` → trade JSON if ok.
