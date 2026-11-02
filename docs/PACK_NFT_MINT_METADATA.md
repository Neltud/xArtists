# Pack NFT — Metadata mint (recto peinture · verso HUD)

> Contrat de metadata pour mint post-paiement. Aligné `GenesisCard3D` + `packNftMetadata.ts`.

## Principe

| Face | Contenu |
|------|---------|
| **Recto** | Peinture sfumato (série Tuduri) — œuvre visible |
| **Verso** | HUD data — pack_id, tier, edition, billing one_time, rights durable, chain |

1 siège = 1 SFT d’édition limitée. **Pas** d’abonnement. Droits durables.

## Collections mainnet

| Pack | Ticker | Cap |
|------|--------|-----|
| Pulse | `XAIPLS-2cf72b` | 333 |
| Yield | `XAIYLD-987e24` | 500 |
| Sentinel | `XAISNT-3d8a6b` | 777 |

## Builder code

```ts
import { buildMintMetadata } from '../config/packNftMetadata'
const meta = buildMintMetadata('pulse', 47, 333)
// → name, attributes, properties.face_recto/verso, media.recto/verso
```

## Flux mint (post-GO)

```
IPN PayBox / Whop one-time validé
  → access-api résout packId + buyer_wallet
  → buildMintMetadata(packId, nextEdition, maxSupply)
  → upload metadata (+ media recto/verso IPFS quand prêts)
  → mint SFT nonce (SC ou owner ESDTNFTCreate)
  → transfer buyer_wallet
  → My Packs affiche GenesisCard3D + on-chain proof
```

Jusqu’au GO : `mint.mode_until_go = paper_simulate` — pas de mint réel.

## Workflows GitHub (connecteurs spécialisés)

| Workflow | Usage |
|----------|--------|
| `issue-agent-pack-collections.yml` | Issue collections (déjà fait) |
| `mint-3-packs-to-admin.yml` | Smoke 3 SFT → admin |
| `mint-test-buypack.yml` | Test buyPack SC |
| `mint-on-payment.yml` | Post-IPN automatisé — paper jusqu’au GO |

## Assets

- Preview live : CSS `GenesisCard3D` (pas besoin d’IPFS pour UX)
- Mint production : `media/*-recto.png` + `*-verso-hud.png` → IPFS
- Status media-manifest : `schema_ready_assets_pending`

## Règles commerciales (lock)

- Packs = one_time + NFT durable
- TCA Membership Whop = renewal **sans** NFT Genesis
- Pas de promesse APR / fonds
