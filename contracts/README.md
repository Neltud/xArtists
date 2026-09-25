# xArtists Smart Contracts (MultiversX) — MAINNET ONLY

| Contract | Path | Status |
|----------|------|--------|
| **NFT Marketplace** | `contracts/nft-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **Agents Marketplace** | `contracts/agents-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **Slot Casino** | `contracts/slot-casino` | Source ready — progressive + EGLD/ESDT — **not deployed** |
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

## Slot Casino (new)

Path: `contracts/slot-casino`

- `spinEgld` / `spinEsdt` (token whitelist)
- Progressive pot (contrib BPS), grand pays full pot
- Table multipliers + house rake BPS
- `claimHouse*` never drains progressive
- Front remains paper until `VITE_SLOT_CASINO_ADDRESS` + codeHash OK

Init example:

```text
progressive_contrib_bps = 2500
house_rake_bps = 1500
min_bet = 50000000000000000   # 0.05 EGLD
```

## Deploy mainnet

```bash
pip install -U multiversx-sdk-cli
export PEM=~/wallets/xartists-mainnet.pem   # NEVER commit
export FEE_BPS=300

chmod +x scripts/*.sh
./scripts/build_scs_isolated.sh
./scripts/deploy_mainnet.sh agents-marketplace   # first
./scripts/deploy_mainnet.sh nft-marketplace
# slot-casino: build + mxpy deploy manually until script lists it
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

**Slot:** spinEgld, spinEsdt, fundProgressive*, claimHouse*, setPaymentTokenAllowed, pause/config + views.

## BTC Bridge

**Do not deploy.** No production mint path.
