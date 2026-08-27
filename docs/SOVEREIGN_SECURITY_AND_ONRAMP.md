# Sovereign security + on-ramp (xArtists mapping)

## Circuit breaker

Solidity `Sovereign_Security` (pause) maps to **existing** MVX stack:

| EVM concept | xArtists / LIA |
|-------------|----------------|
| `triggerEmergencyStop` | `RiskManager` + `risk_manager_state.json` + Guardian |
| Token `whenNotPaused` | SC guards + `LIA_LIVE_TRADING=0` gate |
| Admin lift | Ops + policy engine — never front-only |

Do **not** deploy unreviewed EVM pause contracts as primary path; MultiversX agents-marketplace uses Rust + codeHash gates.

## Fiat on-ramp

| Piece | Path |
|-------|------|
| MoonPay button | `MoonpayButton.tsx` (redirect hosted) |
| Modal demo + simulate | `components/onramp/FiatOnRampModal.tsx` |
| Express options | `ExpressPaymentOptions.tsx` |
| ⌘K « buy / card / fiat » | `IntentBar` → modal |
| Webhook HMAC | **server only** — never commit `MOONPAY_WEBHOOK_SECRET` |

## Liquidity orchestrator

`lia/liquidity/orchestrator.py` — paper cycle → `data/liquidity_cycle.json`.  
No bridge execution until bridge_health + policy + live flags.

## Marketplace escrow (EVM sample)

Reference only (`Marketplace_Escrow.sol` attachments). Production path remains **MultiversX NFT marketplace SC** after deploy + codeHash verify.
