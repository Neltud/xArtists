# xArtists dApp — carte des modules (Vite)

| Route | Module | Rôle | Wallet |
|-------|--------|------|--------|
| `/` | Home / Dashboard | Hub persona, dual market, SC, Guardian | — |
| `/gallery` | Galerie | Catalogue NFT xArtists | lecture |
| `/marketplace` | Market NFT | List / Buy / Bid | **user** + SC live |
| `/studio` | Studio | Mint / metadata / pin | **user** |
| `/agents` | Agents | Packs Model C + GSN signal + SC agents | user / paper |
| `/my-packs` | My Packs | Access paper membership | user |
| `/trading` | Trading | Board paper LIA | **LIA** display |
| `/portfolio` | Portfolio | Book LIA ops MVX+BTC+SOL | **LIA** |
| `/wallet` | Wallet | Soldes Connect | **user** |
| `/dao` | DAO | $TRO policy lecture | user vote si SC |
| `/tro` | $TRO | Cap 500k, burn feed, pools | — |
| `/staking` | Staking | Design — SC pas live | **user** |
| `/hatom` | Hatom | Lending positions **LIA** | LIA |
| `/soul-testnet` | Soul | Paper lend/borrow · experimental | LIA paper |
| `/burnify` | Burnify | LIA BFY + SC tro-burn optionnel | LIA / user SC |
| `/tip` | Tip | Dons → LIA Ops | user envoie |
| `/editions` | Editions | Lettre mensuelle | — |
| `/ads` | Ads | Enchères slots | — |
| `/lp` | LP | Pools lecture | — |

## Séparations obligatoires

1. **User Connect** ≠ **LIA Ops** (`erd1p4zyy…`)
2. **Access packs** ≠ **GreenSmoke** (signal only)
3. **Paper** ≠ **Live** (`LIA_LIVE_TRADING=0`)
4. **Soul** ≠ **Hatom** (Hatom = MVX prod)

## Goulet cash

Deploy `nft-marketplace` + `agents-marketplace` + codeHash → VITE_* → rebuild Pages.
