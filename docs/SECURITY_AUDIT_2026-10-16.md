# Security audit — xArtists · 2026-10-16

**Trigger:** [Kevin Lallement — automated SC scanning on MultiversX](https://x.com/KevinLallement/status/2111072206767722691)

Vectors under review:
1. Admin endpoints missing owner guard
2. Unvalidated parameters (wrong token, wrong amount, identical IDs)

Scope: Rust SC sources in `contracts/` + live mainnet codeHash probe + dApp gates.

## Status tracker

| Item | Status |
|------|--------|
| P0 codeHash 9/9 OK | Done (2026-10-16T18:49Z) |
| `scripts/ops_sc_watch.py` | Done |
| CI `.github/workflows/ops-sc-watch.yml` (6h) | Done |
| dApp default `buyPack` (not buyAgentAction) | Done |
| `docs/EMERGENCY_PAUSE.md` | Done |
| RWA P1 source (cooling + seller≠payer) | Done — **upgrade pending** |
| Owner key cold / multisig | **Ops human** |
| External audit | **Pending** |

## P0 results (live probe)

| Check | Result |
|-------|--------|
| codeHash vs `MAINNET_CODEHASH` (9 SC) | **9/9 OK** |
| Gate OFF required for mismatch | **No** |
| SC balances | market 0.0175 · agents 0.013 · **slot 0.5** EGLD |
| Owner | `erd1kex0pvp9dng8…vl8v0g` (single) |

Continuous monitor:

```bash
python3 scripts/ops_sc_watch.py
BALANCE_ALERT_EGLD=1 python3 scripts/ops_sc_watch.py --json
```

GitHub Actions: **Ops SC watch** (schedule + manual).

## Owner / pause ops

Full procedure: **`docs/EMERGENCY_PAUSE.md`**

- All product SC with funds paths expose `setPaused` (owner-only).
- On anomaly: owner TX `setPaused(true)` then set CI `VITE_*_CODEHASH_OK` false if bytecode suspect.
- Keep owner key cold; prefer multisig when available.

## P1 source hardening

**rwa-escrow-bridge** (source — requires re-deploy/upgrade to be live):
- `openEscrow`: `require!(payer != seller)`
- `resolveDispute`: enforce `DISPUTE_COOLING_SECS` (7 days) before owner resolve
- View `getDisputeCoolingSecs`
- Runbook: `contracts/rwa-escrow-bridge/UPGRADE_P1.md`

**agents / frontend:**
- Pack purchase path defaults to `buyPack` only
- `buyAgentAction` opt-in via env; documented as non-NFT

## SC matrix (Kevin vectors)

| SC | Admin public? | Wrong token buy? | Notes |
|----|---------------|------------------|-------|
| nft-marketplace | No (`require_owner`) | No (`payable("EGLD")` on buy/bid) | Open list any collection |
| agents-marketplace | No | No on `buyPack` | `buyAgentAction` = EGLD only, no NFT |
| agent-stake-escrow | No | EGLD only open | Owner cannot drain user principal |
| nft-staking | No | amount==1 + nonce | Allowlist optional |
| rwa-escrow-bridge | No | EGLD only | Attestor trust; cooling in source |

## Residual risks

1. Compromised **owner** key → pause, claimFees, setPackCollection/Price
2. Compromised **attestor** (RWA) → early release
3. **Paper** packs in localStorage (UI only)
4. **slot_casino** 0.5 EGLD float — monitor
5. RWA P1 source ≠ bytecode until upgrade

## Do / Don't

- DO run `ops_sc_watch` on a cadence
- DO pause + gate OFF on codeHash MISMATCH (`EMERGENCY_PAUSE.md`)
- DON'T claim RWA P1 live until upgrade TX + new codeHash
- DON'T treat `buyAgentAction` as NFT secondary market
- DON'T commit PEM / seed

## Related

- `docs/EMERGENCY_PAUSE.md`
- `docs/SECURITY_AUDIT_2026-09-24.md`
- `contracts/nft-marketplace/AUDIT_DRAFT.md`
- `contracts/agents-marketplace/MAINNET_STATUS.md`
- `contracts/rwa-escrow-bridge/UPGRADE_P1.md`
