# TCA access model

## Primary gate (product truth)

| Path | Access |
|------|--------|
| **Pack Pulse** (holder) | Full TCA classroom + Q&A for **12 months** from pack activation / mint timestamp |
| Observer (no pack) | Public lobby / sample lesson only — no unlimited Q&A |
| Optional future: Student/Scholar fiat sub | Additive, not required if Pulse is held |

MoonPay / EUR subs remain optional commercial extras.  
**Pack Pulse is the native on-chain path** aligned with xArtists packs.

## How the gate works (air-gap)

1. Front reads wallet NFTs / pack ownership (explorer or index).  
2. If Pulse pack present and `now < activated_at + 365d` → `access_level = pack_holder`.  
3. TCA never writes the ledger; it only **reads** ownership + expiry.  
4. Expiry UX: soft banner « renew / extend via pack » — no silent lock mid-lesson if possible.

## Config

See `data/tca/access_rules.json`.

## Honesty

Until pack mint is live on mainnet for Pulse, gate may use allowlist / paper flag for the deployer wallet only.
