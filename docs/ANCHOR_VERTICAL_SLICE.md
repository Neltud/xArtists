# ANCHOR — Vertical Slice xArtists (état réel)

> Mission TMS : Identité → Perception → Action → Pulse  
> **Ne pas repartir de zéro** — le frontend n’est plus « aveugle ».

## Mapping mission → code existant

| Couche mission | Fichiers réels | État |
|----------------|----------------|------|
| **1. Identité** | `WalletContext.tsx`, `MxDappProvider`, `xportalWc` | LIVE — xPortal WC + Web Wallet + Disconnect |
| **Store** | `store/empireStore.ts` (`useEmpireStore`) | LIVE — pas Zustand (useSyncExternalStore, zéro dep) |
| **2. Perception** | `useUserAccount`, `useTroStakedBalance`, `useChainMirror`, **`EmpireBalanceSync`** | LIVE — soldes → empireStore |
| **3. Action** | `useTroStakeTx`, `useMarketplaceTx`, `useVenueRentTx`, `useStudioMintTx`, `bootstrapSendTx` | LIVE — stake user prouvé |
| **TX UX** | `TxShell` → `TransactionOverlay` | LIVE |
| **4. Pulse** | `usePulse`, `PulseBoot`, `brainStream` / mood | Demo cycle OU `VITE_PULSE_API` WS |

## Stack réelle (package.json)

- `@multiversx/sdk-dapp`, `sdk-core`, `sdk-wallet-connect-provider`
- **Pas** de package `@multiversx/connector` (n’existe pas tel quel) — WC via sdk-wallet-connect-provider
- React 18, Vite, Three.js, Tailwind
- **Pas de Zustand** — empireStore = pattern store externe + `useSyncExternalStore`

## Règles d’or (toujours)

1. **Aucun nouveau SC** pour cette slice — adresses `data/contracts.json` / secrets CODEHASH
2. **PEM jamais** côté dApp user
3. Vertical slice user : **Connect → voir soldes → stake/list → overlay TX**

## Flux prouvé mainnet

```
Wallet (xPortal) → EmpireBalanceSync → empireStore.wallet
                 → TroStakePanel → ESDTTransfer@stake → Overlay → Explorer
totalStaked SC > 0 (user + ops)
```

## Prochaines étapes profondeur (ordre)

1. Unstake + getStaked UI (fait) — microtest user unstake
2. Studio issueNonFungible → listNft → listings_index
3. Ownership 3D : `useUserAccount.nfts` → flags `isOwned` sur scènes musée
4. `VITE_PULSE_API` / Akash quand backend up
5. Packs SC mint + Slot secret seulement après dust OK

## Fichiers ajoutés cette ancre

- `components/EmpireBalanceSync.tsx` — câble perception soldes
- `main.tsx` — monte le sync au boot
