# Devnet deploy + blackbox checklist

**Goal:** build isolé → deploy FEE_BPS=300 → valider P0/P1 → puis mainnet faible volume.

**Bridge BTC:** experimental — **ne pas** déployer pour des fonds utilisateurs.

---

## 0. Prérequis

```bash
pip install -U multiversx-sdk-cli
rustup target add wasm32-unknown-unknown   # si build local

# Wallet DEVNET avec EGLD (faucet MultiversX)
export PEM=~/wallets/xartists-devnet.pem   # jamais commit
export FEE_BPS=300
export CHAIN=D
export PROXY=https://devnet-gateway.multiversx.com
```

Faucet: https://devnet-wallet.multiversx.com → Faucet

---

## 1. Build isolé

```bash
chmod +x scripts/*.sh
./scripts/build_scs_isolated.sh
# ou un seul:
./scripts/build_scs_isolated.sh agents-marketplace
./scripts/build_scs_isolated.sh nft-marketplace
```

Succès = fichiers `contracts/*/output/*.wasm`.

Si échec workspace: ces scripts font `cd contracts/<name>` uniquement (pas de members staking cassés).

---

## 2. Deploy devnet

```bash
./scripts/deploy_devnet.sh
# ou:
./scripts/deploy_devnet.sh agents-marketplace
./scripts/deploy_devnet.sh nft-marketplace
```

Écrit `data/contracts.json` avec:

- `agents_marketplace` / `agents-marketplace`
- `marketplace_nft` / `nft-marketplace`
- `chain`: `"D"`
- `fee_bps`: `300`

**Vellum** (même logique):

```text
CHAIN=D
PROXY=https://devnet-gateway.multiversx.com
FEE_BPS=300
DEPLOY_CONTRACT=agents-marketplace   # ou all
LIA_WALLET_PEM / PATH = secret only
→ run deploy_scs_node puis publish_data_for_frontend
```

---

## 3. Blackbox checklist agents

Remplacer `SC` par l’adresse déployée.

| # | Action | Attendu |
|---|--------|--------|
| A1 | `listAgentAction` price=0 | fail |
| A2 | `listAgentAction` agent_id vide ou >64 bytes | fail |
| A3 | `listAgentAction` id=`LIA-v6` price=0.01 EGLD | ok, listing 1 active |
| A4 | `getListing(1)` | seller, price, active=true |
| A5 | `buyAgentAction(999)` | fail listing not found |
| A6 | `buyAgentAction(1)` value exact 0.01 | seller ≈ 0.0097, `getAccumulatedFees` ≈ 0.0003 |
| A7 | `buyAgentAction(1)` again | fail inactive |
| A8 | list + buy with value > price | excess refunded to buyer |
| A9 | `cancelListing` from non-seller | fail |
| A10 | `setPaused(true)` from non-owner | fail |
| A11 | `setPaused(true)` owner → list/buy | fail paused |
| A12 | `setPaused(false)` | ok |
| A13 | `claimFees` non-owner | fail |
| A14 | `claimFees` owner | accumulated_fees → 0, owner +fees |
| A15 | `transferOwnership(B)` puis `acceptOwnership` from A | fail |
| A16 | `acceptOwnership` from B | owner = B |

Explorer: https://devnet-explorer.multiversx.com/accounts/SC

---

## 4. Blackbox checklist NFT

| # | Action | Attendu |
|---|--------|--------|
| N1 | `listNft` without NFT payment | fail |
| N2 | list royalty_bps such that fee+royalty > 100% | fail |
| N3 | list 1 NFT + royalty 500 + fee 300 | ok |
| N4 | `buyNft` missing id | fail |
| N5 | buy exact price | NFT → buyer, seller net, fees accumulated |
| N6 | buy overpay | excess → buyer |
| N7 | `cancelListing` seller | NFT back |
| N8 | pause → list/buy fail | ok |

---

## 5. Frontend après deploy

```bash
export VITE_AGENTS_MARKETPLACE_ADDRESS=<erd1qqq...>
export VITE_AGENTS_FEE_BPS=300
export VITE_MARKETPLACE_ADDRESS=<nft erd1qqq...>
```

Commit **uniquement** `data/contracts.json` (adresses publiques).

```bash
git add data/contracts.json
git commit -m "chore: devnet SC addresses fee_bps=300"
git push
```

Mirror catalog / warps via `publish_data_for_frontend` si Vellum.

---

## 6. Mainnet faible volume (après checklist verte)

```bash
export CHAIN=1
export PROXY=https://gateway.multiversx.com
export FEE_BPS=300
export PEM=~/wallets/xartists-mainnet.pem   # hardware / cold si possible

./scripts/build_scs_isolated.sh
./scripts/deploy_all_scs.sh agents-marketplace   # d’abord agents seuls
# tests micro (0.01 EGLD) puis nft-marketplace
```

- Owner = deployer ; planifier `transferOwnership` vers multisig (P2)
- Ne pas déployer btc-bridge
- TVL faible jusqu’audit externe (P2)

---

## 7. Note contrats déjà déployés

Une instance **ancienne** n’a pas pause / claimFees / accumulated_fees / ownership 2-step.  
Il faut **nouveau deploy** (adresses nouvelles) ou upgrade codehash selon policy chaîne.  
Mettre à jour `data/contracts.json` + env frontend après chaque deploy.

---

## 8. P2 (ouvert)

- Whitelist collections NFT
- Multisig / Guardian owner
- Audit externe payant avant TVL significatif
- Bridge redesign (mint ESDT, timelock, de-dup relayers)

*xArtists — 2026-08-02*
