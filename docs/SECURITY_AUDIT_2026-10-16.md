# Security audit — xArtists · 2026-10-16

**Trigger:** [Kevin Lallement — automated SC scanning on MultiversX](https://x.com/KevinLallement/status/2111072206767722691)

Vectors under review:
1. Admin endpoints missing owner guard
2. Unvalidated parameters (wrong token, wrong amount, identical IDs)

Scope: Rust SC sources in `contracts/` + live mainnet codeHash probe + dApp gates.

## P0 results (live probe)

| Check | Result |
|-------|--------|
| codeHash vs `MAINNET_CODEHASH` (9 SC) | **9/9 OK** (2026-10-16T18:49Z) |
| Gate OFF required for mismatch | **No** |
| SC balances | market 0.0175 · agents 0.013 · **slot 0.5** EGLD |
| Owner | `erd1kex0pvp9dng8…vl8v0g` (single) |

Continuous monitor:

```bash
python3 scripts/ops_sc_watch.py
BALANCE_ALERT_EGLD=1 python3 scripts/ops_sc_watch.py --json
```

## Owner / pause ops

- All product SC with funds paths expose `setPaused` (owner-only).
- On anomaly: owner TX `setPaused(true)` then set CI `VITE_*_CODEHASH_OK` false if bytecode suspect.
- Keep owner key cold; prefer multisig when available.

## P1 source hardening (this commit)

**rwa-escrow-bridge** (source — requires re-deploy/upgrade to be live):
- `openEscrow`: `require!(payer != seller)`
- `resolveDispute`: enforce `DISPUTE_COOLING_SECS` (7 days) before owner resolve
- View `getDisputeCoolingSecs`

## SC matrix (Kevin vectors)

| SC | Admin public? | Wrong token buy? | Notes |
|----|---------------|------------------|-------|
| nft-marketplace | No (`require_owner`) | No (`payable("EGLD")` on buy/bid) | Open list any collection |
| agents-marketplace | No | No on `buyPack` | `buyAgentAction` pays EGLD without NFT transfer — product gap |
| agent-stake-escrow | No | EGLD only open | Owner cannot drain user principal |
| nft-staking | No | amount==1 + nonce | Allowlist optional |
| rwa-escrow-bridge | No | EGLD only | Attestor trust; cooling now in source |

## Residual risks (not automated public drains)

1. Compromised **owner** key → pause, claimFees, setPackCollection/Price
2. Compromised **attestor** (RWA) → early release
3. **Paper** packs in localStorage (UI only)
4. **slot_casino** 0.5 EGLD float — monitor
5. Source ≠ bytecode after local P1 RWA edits until upgrade

## Do / Don't

- DO run `ops_sc_watch.py` on a cadence (cron / Actions)
- DO pause + gate OFF on codeHash MISMATCH
- DON'T claim RWA P1 live until upgrade TX + new codeHash in `contracts.ts`
- DON'T treat `buyAgentAction` as NFT secondary market

## Related

- `docs/SECURITY_AUDIT_2026-09-24.md` (repo / DEMO posture)
- `contracts/nft-marketplace/AUDIT_DRAFT.md`
- `contracts/agents-marketplace/MAINNET_STATUS.md`
