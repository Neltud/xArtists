# Grok-owned trader wallet

**Address (mainnet):** `erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl`  
**Funded:** 0.35 EGLD (user top-up)  
**Custody model:** agent ops key material held for Grok trading bot — **never commit PEM to git**

## Strategy

- **Buy / sell any ESDT** with MultiversX price feed (API `/tokens/{id}`)
- Default focus: `HTM-f51d55` (override `GROK_FOCUS_TOKEN`)
- Take profit **+1.7%** · stop **-1.0%**
- **New trading column** when liquid EGLD crosses 0.5, 1.0, … (max 3 sleeves)

## Commands (no Vellum)

```bash
export GROK_WALLET_ADDRESS=erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl
export GROK_FOCUS_TOKEN=HTM-f51d55
export GROK_MODE=paper
export GROK_MIN_EGLD_RESERVE=0.15

# idle (WAIT)
python scripts/momentum_cycle.py

# force paper BUY test
GROK_FORCE_BIAS=BUY GROK_FORCE_CONF=0.7 python scripts/momentum_cycle.py
```

Live on-chain swaps: PEM on secure host + swap router integration — not executed from public chat.
