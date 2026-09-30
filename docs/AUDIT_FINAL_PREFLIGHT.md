# xArtists — Final Pre-Flight Audit (Mainnet)

**Stack:** MultiversX (Rust `multiversx-sc`), Vite React front, GitHub Pages.  
**Not Ethereum/Solidity** — no OpenZeppelin; use MVX patterns below.

Date: 2026-09-30 · Branch: `main`

---

## PART 1 — Self-Audit

### 1.1 Smart contracts (Financial core)

| Check | Slot Casino | Treasury Splitter | NFT Marketplace | Verdict |
|-------|-------------|-------------------|-----------------|---------|
| Pause / circuit breaker | `require_not_paused` + `setPaused` owner | pause present | `setPaused` + `isPaused` view | **PASS** |
| Access control | `require_owner` + **2-step** `pending_owner` | owner guards | `require_owner` | **PASS** (transfer → multisig ready) |
| Re-entrancy (MVX) | No classic ETH callback reentry; **CEI**: clear pending **before** payout send in `resolve_spin` | CEI-style | effects before external | **PASS** (no `nonReentrant` keyword; pattern OK) |
| Overflow | `BigUint` only for amounts | `BigUint` | `BigUint` | **PASS** |
| Gas / loops | Bounded pending per user (`MAX_PENDING_PER_USER`) | limited splits | listing bounds | **PASS** with monitoring |

**Notes**
- MultiversX VM does not use Solidity 0.8 checked arithmetic; **BigUint** is the safe path (used).
- Formal third-party audit still recommended before large TVL.
- **Action ops:** move `owner` to multisig (Safe-compatible address on MVX if used), then only multisig calls `setPaused` / withdraw.

### 1.2 Frontend & AI (Sensory layer)

| Check | Status | Evidence |
|-------|--------|----------|
| ErrorBoundary | **PASS** | `ErrorBoundary` wraps App; route boundaries where present |
| TX Pending/Success/Fail | **PASS** | `empireStore` + `TransactionOverlay` + `TransactionMonitor` → `txLog` |
| useSyncExternalStore stability | **PASS** | Snapshots stable after React #185 fix (audio cache + zone no-op) |
| Safety Switch → paper | **PASS** | `forcePaperMode` on hard TX failures |
| LIA Shadow / fallback 2s | **PASS** | `shadowEngine` + `useLIAInterpreter` timeout |
| System Maintenance banner | **PASS** | polls Slot pause via API |
| Grand Switch fail-closed | **PASS** | `evaluateGrandSwitch()` |

**Optional stress:** artificial 5s LIA delay — paper phrases still fire; shadow `liaPending` then timeout → market pulse (already coded).

### 1.3 Environment & secrets

| Check | Status |
|-------|--------|
| No PEM / private keys in repo | **PASS** (policy + `scripts/check-no-secrets.mjs`) |
| CODEHASH never committed `=1` | **PASS** (GH Pages secrets only) |
| Live = `VITE_LIVE_MODE` / `VITE_APP_MODE=live` + CODEHASH | **PASS** (`appMode` + `grandSwitch`) |
| Mainnet addresses | **PASS** `public/data/contracts.json` LIVE set |

Run before each release:

```bash
node scripts/check-no-secrets.mjs
```

---

## PART 2 — Mainnet deployment sequence (actual)

Contracts are **already deployed** on MultiversX mainnet (see `contracts.json`). Sequence for *any new* SC or ownership change:

1. **Build & test** SC in isolation (devnet optional).
2. **Deploy / upgrade** with deployer PEM in CI secret only — never VITE_*.
3. **Verify** codeHash on [explorer](https://explorer.multiversx.com) vs `contracts.json`.
4. **Set GH Pages secrets** `VITE_*_CODEHASH_OK=1` only after verify.
5. **Transfer ownership** to multisig (`propose` → accept pending owner).
6. **Fund House** (Slot progressive + liquid house above jackpot needs).
7. **Rebuild Pages** → confirm Grand Switch on `/go-live`.
8. **Dust test** (stake → spin → market) with real micro amounts.
9. **Public announcement** only after dust green.

Order historically used: staking / marketplace / venue / treasury / **slot** (already live).

---

## PART 3 — Post-launch watchtower

| Item | Plan |
|------|------|
| Treasury / house balance | `/go-live` Dust panel + explorer SC balance |
| TX failures | `txLog` session + optional future Sentry DSN (`VITE_SENTRY_DSN`) |
| Slot pause | `SystemMaintenanceBanner` |
| LIA drift | Shadow fallback to market pulse; no price-write from LIA |

---

## Final verdict

| Pillar | Result |
|--------|--------|
| 1.1 SC guards | **GO** (with multisig ownership transfer as ops step) |
| 1.2 Front / AI | **GO** |
| 1.3 Secrets | **GO** |
| Dust user validation | **PENDING human** (1 real spin + 1 stake visible on explorer) |

**Authorization:** Front + SC patterns are ready for production *discipline*.  
**Blocker for “public open”:** complete dust gauntlet + multisig owner + house fund documented.

### Immediate ops checklist

- [ ] `node scripts/check-no-secrets.mjs`
- [ ] Explorer: Slot / Staking / Market codeHash == `contracts.json`
- [ ] Secrets Pages: LIVE + CODEHASH flags
- [ ] Owner → multisig
- [ ] Fund Slot house
- [ ] Dust: 1 TRO stake, 1 spinEgld, 1 list or buy
- [ ] `/go-live` all green
- [ ] Announce
