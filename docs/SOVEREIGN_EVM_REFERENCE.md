# Sovereign EVM — référence (piste parallèle)

Stack **principale xArtists = MultiversX** (Rust SC, sdk-dapp, Pages).  
Les contrats Solidity ci-dessous sont une **piste EVM / lab** (Sepolia) — **ne pas** déployer avec des clés dans le repo.

## Fichiers conceptuels reçus

| Contrat | Rôle |
|---------|------|
| `TRO_Master` | ERC-20 Ownable + mint owner |
| `Sovereign_Governance` | Vote pondéré `balanceOf(TRO)` |
| `Marketplace_Escrow` | Listing + lock ETH + confirm delivery |
| `DeploySovereignCore` | Script Foundry Sepolia |

## ⚠️ Failles critiques (Marketplace_Escrow)

1. **`confirmDelivery`** fait `transfer(address(this).balance)` → vide **tout** le contrat, pas seulement le listing.
2. **`withdraw()`** public : n’importe qui peut vider le contrat.
3. Pas de mapping `buyer` par listing → pas de refund propre / dispute.
4. Pas de `assetId` vérifié on-chain (NFT transfer).

→ **Ne pas déployer en prod** sans rewrite (balances par listing, onlyBuyer/onlySeller, pull payment).

## Gouvernance

- Vote = snapshot `balanceOf` au moment du vote (pas de lock, flash-loanable).
- `executeProposal` onlyOwner sans quorum → centralisé.

## Alignement xArtists

| EVM concept | Équivalent MVX / dApp |
|-------------|------------------------|
| TRO_Master | ESDT `$TRO` existant |
| Governance | page `/dao` + paper |
| Marketplace_Escrow | SC marketplace Rust (codeHash pending) |
| IdentityDashboard | Paper Soul + entity map |
| LIA_Monitor | `LiaMonitor.tsx` Vite |

## Agent de voyage

- Pack UI : `AGENT_PACKS` id `voyage`
- Catalogue : `lia-voyage-01`
- GSN agent : `Voyage` dans `greensmoke_forecasts.json`
- Panel : `VoyageAgentPanel.tsx`

## Secrets

Ne **jamais** committer `PRIVATE_KEY` / Alchemy URL réelle.  
Utiliser secrets CI / Vellum wallet PEM hors git.
