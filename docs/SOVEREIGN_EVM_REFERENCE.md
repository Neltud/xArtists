# Sovereign EVM — référence (pas runtime MVX)

Fichiers fournis (Solidity / Foundry) : idées **cross-chain / lab**, pas le déploiement principal xArtists (MultiversX).

## Contrats

| Contrat | Rôle |
|---------|------|
| `TRO_Master` | ERC20 mint owner |
| `Sovereign_Governance` | Vote pondéré balance $TRO |
| `Marketplace_Escrow` | Listing + lock ETH + confirm delivery |

## ⚠️ Sécurité (ne pas déployer tel quel en prod)

**Marketplace_Escrow**
- `confirmDelivery` fait `transfer(address(this).balance)` → **vide tout le contrat**, pas seulement le prix du listing
- `withdraw()` : **n’importe qui** peut retirer tout le balance
- Pas de mapping buyer / refund / dispute réel
- Pas de lien NFT / asset on-chain (seul `assetId` string)

**Sovereign_Governance**
- Vote = snapshot `balanceOf` au moment du vote (pas de lock / snapshot block)
- `executeProposal` onlyOwner sans quorum ni logique métier

**TRO_Master**
- Mint illimité onlyOwner — ok lab, pas tokenomics $TRO MVX (max supply 500k ESDT)

## Mapping xArtists

| EVM lab | MVX / dApp |
|---------|------------|
| TRO_Master | ESDT $TRO on MultiversX |
| Governance | page `/dao` + paper |
| Marketplace_Escrow | SC `agents-marketplace` / NFT market (Rust) |
| IdentityDashboard UI | paper soul + packs |
| LIA_Monitor UI | `LiaMonitor` Vite |

Deploy Foundry Sepolia = optionnel lab. **LIA live path reste MultiversX + Vellum.**
