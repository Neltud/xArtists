# xArtists Smart Contracts (MultiversX) — MAINNET ONLY

| Contract | Path | Status |
|----------|------|--------|
| **NFT Marketplace** | `contracts/nft-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **Agents Marketplace** | `contracts/agents-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **BTC Bridge** | `contracts/btc-bridge` | **EXPERIMENTAL — DO NOT deploy / no user funds** |
| NFT Staking | `contracts/nft-staking` | Cargo only — incomplete |
| TRO Staking | `contracts/tro-staking` | Cargo only — incomplete |

## Network policy

**Mainnet only** (`CHAIN=1`, `https://gateway.multiversx.com`).  
Devnet scripts are disabled.

## Security (2026-08-02)

**P0+P1 applied:** upgrade/owner ACL, pause, CEI, fee+royalty ≤100%, excess refund, accumulated_fees, 2-step ownership, agent_id length cap.

**P2 open:** collection whitelist, multisig owner, external audit, bridge redesign.

See `docs/MAINNET_DEPLOY_BLACKBOX.md`.

## Deploy mainnet

```bash
pip install -U multiversx-sdk-cli
export PEM=~/wallets/xartists-mainnet.pem   # NEVER commit
export FEE_BPS=300

chmod +x scripts/*.sh
./scripts/build_scs_isolated.sh
./scripts/deploy_mainnet.sh agents-marketplace   # first
./scripts/deploy_mainnet.sh nft-marketplace
# or both:
./scripts/deploy_mainnet.sh
```

Writes addresses into `data/contracts.json` (`chain: "1"`, `network: "mainnet"`).

After deploy:

1. Blackbox micro-EGLD checklist (`docs/MAINNET_DEPLOY_BLACKBOX.md`)
2. Commit `data/contracts.json` only (no PEM)
3. `VITE_AGENTS_MARKETPLACE_ADDRESS` / `VITE_MARKETPLACE_ADDRESS` / `VITE_AGENTS_FEE_BPS=300`
4. Explorer: https://explorer.multiversx.com

## Endpoints

**Agents:** listAgentAction, buyAgentAction (payable EGLD), cancelListing, claimFees, setPaused, setFeeBps, transferOwnership, acceptOwnership + views.

**NFT:** listNft (1 NFT), buyNft (EGLD), cancelListing, claimFees, setPaused, setFeeBps, ownership 2-step + views.

## BTC Bridge

**Do not deploy.** No production mint path.
