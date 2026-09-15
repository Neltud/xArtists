# LIA executor — workstream

## Code map (real files)

| Path | Role |
|------|------|
| `lia/executor/universal.py` | Host executor — paper default, live via mxpy + PEM |
| `lia/executor/mode.py` | **`resolve_mode`**: auto → paper unless `LIA_LIVE_TRADING=1` + PEM |
| `nodes/universal_executor.py` | Vellum-style node — dispatch swap/stake/claim |
| `docs/EXECUTOR.md` | Operator summary |

## Mode resolution (mandatory)

```python
from lia.executor.mode import resolve_mode, mode_report
print(mode_report("auto"))  # resolved=paper unless flag+pem
```

| force_mode | LIA_LIVE_TRADING | PEM | Result |
|------------|-----------------|-----|--------|
| paper | * | * | paper |
| auto | 0 | * | **paper** |
| auto | 1 | missing | **paper** |
| auto | 1 | ok | live |
| live | 1 | ok | live |
| live | 0 | * | **paper** (safe fallback) |

## Paper path (safe default)

```bash
export LIA_LIVE_TRADING=0
python -m lia.executor.universal
```

## Live path (ops only)

```bash
export CHAIN=1
export LIA_LIVE_TRADING=1
export LIA_WALLET_PEM_PATH=/secure/lia.pem
# only after SC + risk review
```

## Definition of done

- [x] Paper path returns synthetic tx ids without chain  
- [x] Live requires flag + PEM  
- [x] `auto` cannot skip the flag (`mode.py`)  
- [ ] End-to-end live swap on mainnet with breaker + log  
- [ ] Wire board signals → `TxIntent` without Vellum requirement  
- [ ] ContrarianBrain / GSN only if callable from graph (else keep not-active doc)  

## Relation to SC deploy

Executor live **NFT list/buy** needs marketplace `codeHash` non-null.  
Swaps can use external DEX pairs without product SC, still under risk limits.
