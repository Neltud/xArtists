# xArtists Smart Contracts (MultiversX)

| Contract | Path | Status |
|----------|------|--------|
| **NFT Marketplace** | `contracts/nft-marketplace` | P0+P1 hardened — list/buy, royalties, pause, CEI, claimFees, 2-step ownership |
| **Agents Marketplace** | `contracts/agents-marketplace` | P0+P1 hardened — list/buy, pause, CEI, claimFees, agent_id cap |
| **BTC Bridge** | `contracts/btc-bridge` | **EXPERIMENTAL ONLY — DO NOT send user funds** |
| NFT Staking | `contracts/nft-staking` | Cargo only — incomplete |
| TRO Staking | `contracts/tro-staking` | Cargo only — incomplete |

## Security remediation (2026-08-02)

**P0 applied**

- `upgrade` gated `#[only_owner]`
- NFT: `listing not found` check; `fee_bps + royalty_bps <= 100%` at list & buy
- CEI: listing deactivated **before** EGLD/NFT transfers
- Bridge labeled experimental (no production use)

**P1 applied**

- Agents: `setPaused` / `isPaused`
- NFT buy: excess EGLD refunded to buyer
- `transferOwnership` + `acceptOwnership` (2-step)
- `accumulated_fees` tracker; `claimFees` pays only that amount
- `agent_id` length 1..=64

**Still open (P2)**

- Collection whitelist NFT
- Multisig / Guardian owner
- External paid audit before significant TVL
- Bridge full redesign (mint ESDT, timelock use, relayer de-dup)

See `docs/SECURITY_AUDIT_SC_2026-08-02.md` if present.

## Deploy

```bash
pip install multiversx-sdk-cli
export PEM=~/wallets/xartists-deployer.pem   # NEVER commit
export CHAIN=D   # devnet first
export PROXY=https://devnet-gateway.multiversx.com
export FEE_BPS=300

# Isolated build (avoid broken workspace members)
cd contracts/agents-marketplace && mxpy contract build
cd ../nft-marketplace && mxpy contract build

# Deploy via scripts or Vellum deploy_scs_node
```

After deploy: write addresses to `data/contracts.json` (no PEM).

## Endpoints — Agents

| Endpoint | Access |
|----------|--------|
| `listAgentAction` | public (not paused) |
| `buyAgentAction` | payable EGLD |
| `cancelListing` | seller |
| `claimFees` | owner |
| `setPaused` / `setFeeBps` | owner |
| `transferOwnership` / `acceptOwnership` | owner / pending |
| views: `getListing`, `getFeeBps`, `getAccumulatedFees`, `isPaused`, `getOwner` | |

## Endpoints — NFT

| Endpoint | Access |
|----------|--------|
| `listNft` | payable 1 NFT |
| `buyNft` | payable EGLD |
| `cancelListing` | seller |
| `claimFees` / `setPaused` / `setFeeBps` | owner |
| `transferOwnership` / `acceptOwnership` | owner / pending |

## BTC Bridge

**EXPERIMENTAL SKELETON.** No real sBTC mint, signature path unverified for production, timelock unused. **Do not deposit user funds.**
