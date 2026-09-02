# Review poussée dApp — 2026-08-03

## Bug « 173 NFT / affiche 0 »

| Métrique | Valeur live | Source |
|----------|-------------|--------|
| NFT **dans wallet LIA** | **8** | `GET /accounts/{LIA}/nfts/count` |
| NFT **toutes collections xArtists** | **~275** | somme `/collections/{id}/nfts/count` |
| Ancien JSON | **0** | `xartists_onchain.json` daté 2026-06-20 figé |

**Confusion :** catalogue (ex. NFTUDURI 152 + autres ≈ 173–275) ≠ possession wallet.

**Fix :** `useLiaOnchainLive` + labels Dashboard séparés + JSON rafraîchi.

## SC marketplace

Adresse `…8354t` : **code vide** mainnet → deploy obligatoire avant List/Buy.

## Wallet Connect « vrai »

| Méthode | État |
|---------|------|
| Web Wallet redirect | Callback address OK |
| Extension | getAddress si installée |
| xPortal deep link | Ouvre app ; **QR WC complet** nécessite login sdk-dapp modulaire |
| Paste address | Read-only — TxCapabilityBanner |
| PEM navigateur | **Interdit** |

`bootstrapSendTx` injecte `__xartistsSendTx` ; signature live = extension ou DappProvider + login WC.

## Onglets

| Route | Verdict |
|-------|---------|
| Dashboard | LIA ops + live counts |
| Studio | Guide mint ; Pinata plus tard |
| Gallery | Catalogue |
| Market | TX prêtes code ; SC pas déployé |
| Agents | LIA packs ≠ GSN |
| Trading | Board paper |
| Portfolio | LIA scan |
| DAO | **Read-only** (P0) |
| $TRO / Hatom / LP / Tip / Wallet | Labels LIA vs user |

## Vellum deploy prep

1. Secrets : PEM, PINATA_JWT (later), LIA_LIVE_TRADING=0
2. Deploy nft-marketplace + agents-marketplace
3. post_deploy_contracts.py
4. next_run publish JSON
5. Rebuild Pages
6. Micro-trades before live=1
