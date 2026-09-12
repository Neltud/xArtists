# Micro mainnet — wallet test 0.35 EGLD

**Address :** `erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl`  
**Fund TX :** `f18e534d…ec94f0` · **0.35 EGLD**

## Paper test (DONE 2026-09-12)

| Field | Value |
|-------|-------|
| Mode | paper |
| Reserve | 0.15 EGLD |
| Liquid | 0.20 EGLD |
| Risk budget (5%) | **0.01 EGLD** |
| Signal | WAIT / 0.50 → **idle** |
| TX | none |

## Autocompound mainnet — règles micro

Avec **0.35 EGLD**, le profil LIA « réserve 1.50 » est impossible. Profil **MICRO** :

| Param | Micro |
|-------|-------|
| `GROK_MIN_EGLD_RESERVE` | **0.15** |
| Risk / jour | **5 %** du liquid → ~**0.01 EGLD** max |
| Max trades / jour | **1** |
| Slippage | ≤ 1.5 % |
| Universe | EGLD ↔ TRO-94c925 **only** si pool depth OK ; sinon idle |
| Dust / NFT | ignore |
| Autocompound | gains nets → 80 % réserve / 20 % sleeve (micro) |

## Passage live (ops only)

```bash
export GROK_WALLET_ADDRESS=erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl
export GROK_MODE=live
export GROK_LIVE_TRADING=1
export GROK_MIN_EGLD_RESERVE=0.15
export GROK_WALLET_PEM_PATH=/secure/grok-trader.pem   # machine ops, pas git
# puis module swap xExchange — pas encore dans daily_cycle.py paper
```

**Sans PEM + route swap signée = pas de TX live réelle.**  
Sandbox Grok ne signe pas les TX mainnet.

## Stratégies actives (ordre)

1. **S1 micro-preservation** — ne pas brûler le gas  
2. **S2 signal** — idle si WAIT  
3. **S3 TRO DCA** — seulement si conf ≥ 0.65 **et** risk budget ≥ fee×3  

## Next

- [x] Fund + paper cycle  
- [ ] Brancher signaux LIA/GSN (conf réelle)  
- [ ] Ops : PEM + 1 swap micro test  
- [ ] Autocompound journal après 1er fill  
