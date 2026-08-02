# Mainnet deploy + blackbox (micro amounts)

**xArtists = MAINNET ONLY.** No devnet path.

**Goal:** build isolé → deploy FEE_BPS=300 → checklist micro-EGLD → frontend env.

**BTC bridge:** experimental — **do not deploy**.

---

## 0. Prérequis

```bash
pip install -U multiversx-sdk-cli
rustup target add wasm32-unknown-unknown

export PEM=~/wallets/xartists-mainnet.pem   # NEVER commit — hardware wallet preferred for owner later
export FEE_BPS=300
export CHAIN=1
export PROXY=https://gateway.multiversx.com
```

Wallet must hold enough **mainnet EGLD** for deploy gas (~0.1–0.5 EGLD selon network) + micro tests.

---

## 1. Build isolé

```bash
chmod +x scripts/*.sh
./scripts/build_scs_isolated.sh
```

Succès = `contracts/*/output/*.wasm`.

---

## 2. Deploy mainnet

```bash
# Recommended entrypoint (refuses CHAIN != 1)
./scripts/deploy_mainnet.sh

# Agents first (lower risk surface)
./scripts/deploy_mainnet.sh agents-marketplace

# Then NFT
./scripts/deploy_mainnet.sh nft-marketplace
```

Writes `data/contracts.json`:

- `agents_marketplace`, `marketplace_nft`
- `chain`: `"1"`, `network`: `"mainnet"`
- `fee_bps`: `300`

### Vellum operator

```text
MAINNET ONLY
CHAIN=1
PROXY=https://gateway.multiversx.com
FEE_BPS=300
LIA_WALLET_PEM = secret (never log)
1. Isolated mxpy contract build in contracts/agents-marketplace then nft-marketplace
2. Deploy --arguments 300 --chain 1
3. data/contracts.json addresses + chain=1 + fee_bps=300
4. publish_data_for_frontend + git push (addresses only)
5. NEVER deploy btc-bridge
6. Report addresses + tx hashes
```

---

## 3. Blackbox agents (micro amounts mainnet)

Use **0.01 EGLD** (or smaller) list prices.

| # | Action | Expected |
|---|--------|----------|
| A1 | list price 0 | fail |
| A2 | agent_id empty or >64 | fail |
| A3 | list `LIA-v6` price 0.01 EGLD | ok |
| A4 | getListing(1) | active=true |
| A5 | buy missing id | fail |
| A6 | buy exact 0.01 | seller ~0.0097, accumulated_fees ~0.0003 |
| A7 | buy same listing again | fail inactive |
| A8 | buy overpay | excess refunded |
| A9 | cancel non-seller | fail |
| A10 | setPaused non-owner | fail |
| A11 | pause → list/buy fail | ok |
| A12 | unpause | ok |
| A13 | claimFees non-owner | fail |
| A14 | claimFees owner | fees → owner |
| A15–16 | transferOwnership 2-step | only pending can accept |

Explorer: https://explorer.multiversx.com

---

## 4. Blackbox NFT (micro)

| # | Action | Expected |
|---|--------|----------|
| N1 | list without NFT | fail |
| N2 | fee+royalty > 100% | fail |
| N3 | list 1 NFT + valid royalty | ok |
| N4 | buy missing id | fail |
| N5 | buy exact | NFT to buyer, fee accumulated |
| N6 | overpay | excess refunded |
| N7 | cancel | NFT back to seller |
| N8 | pause blocks list/buy | ok |

---

## 5. Frontend

```bash
VITE_AGENTS_MARKETPLACE_ADDRESS=<erd1qqq...>
VITE_AGENTS_FEE_BPS=300
VITE_MARKETPLACE_ADDRESS=<nft erd1qqq...>
```

```bash
git add data/contracts.json
git commit -m "chore: mainnet SC addresses fee_bps=300"
git push
```

---

## 6. Ops safety (mainnet)

- Deploy with minimal EGLD; keep owner key offline when possible
- After stable: `transferOwnership` → multisig (P2)
- Do not deploy btc-bridge
- Low TVL until external audit (P2)
- Old SC instances without P0/P1 need **new deploy** + new addresses

---

## 7. P2 open

- NFT collection whitelist
- Multisig / Guardian owner
- External paid audit
- Bridge full redesign

*xArtists — mainnet only — 2026-08-02*
