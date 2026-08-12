# xArtists dApp — carte des modules (front Vite)

**Stack** : React + React Router + Tailwind · GH Pages · MultiversX  
**Shell global** : PrivateReleaseStrip · GuardianStatusBar · Header · BottomNav · TxShell (pages TX)

---

## Routes & pages

| Route | Page | Rôle | Wallet | TX live |
|-------|------|------|--------|---------|
| `/` | Dashboard | Hub · persona · dual market · commander | — | non |
| `/studio` | ArtistStudio | Mint guide · IPFS | user | partiel |
| `/gallery` | Gallery | Catalogue NFT | — | non |
| `/marketplace` | Marketplace | List/Buy/Bid | user | **gate codeHash** |
| `/agents` | Agents | Packs 18/12/8 · GSN signal · checkout | user | gate agents SC |
| `/my-packs` | MyPacks | Access Model C · paper feed | user | fiat→mint API |
| `/trading` | Trading | Board / signals | — | non |
| `/portfolio` | Portfolio | **LIA protocole** (≠ user) | LIA ops data | non |
| `/wallet` | Wallet | **User** balances only | user | non |
| `/dao` | DAO | Proposals · $TRO | user | read-only vote |
| `/tro` | TroPage | Token · burn feed · split | — | burn gate |
| `/hatom` | HatomPage | Lending MVX LIA view | — | externe |
| `/lp` | LPPoolsPage | LP pools | — | externe |
| `/tip` | Tip | Tips protocole | user | tip TX |
| `/staking` | StakingPage | NFT stake UI | user | si SC |
| `/editions` | Editions | Newsletter | — | non |
| `/ads` | AdsPage | Ad slots | — | memo bid |
| `/soul-testnet` | SoulTestnetPage | pre-mainnet | **no funds** | non |
| `/burnify` | BurnifyPage | TRO burn shell | pre-mainnet | gate |
| `/agents/polylia` | AgentsPolyliaPage | pred markets paper | — | non |

---

## Distinction critique

| Surface | Contenu |
|---------|---------|
| **Wallet** | Adresse Connect utilisateur |
| **Portfolio / LIA** | Wallet protocole `lia_ops` + board |
| **My Packs** | Access pass Model C + paper router |
| **Market** | NFT art on-chain (après deploy) |
| **Agents** | Catalogue packs + GSN info only |

---

## Gates produit

1. `VITE_MARKETPLACE_CODEHASH_OK` · `VITE_AGENTS_CODEHASH_OK`  
2. `paste_readonly` → pas de List/Buy  
3. Guardian bar (SAFE → KILLED)  
4. Pre-mainnet Soul/Burnify : `acceptUserFunds: false`  
5. Model C : pas de deposit trading user  

---

## Shell composants clés

- `ScStatusBanner` — SC live / blocked  
- `TxCapabilityBanner` — signature possible ?  
- `UserWalletGuard` — refuse LIA ops comme session  
- `PackCheckout` + `AccessTermsModal`  
- `VirtualNftGrid` — perf galerie  
- `CommanderStrip` — risk / brains  

---

*Mettre à jour cette carte à chaque nouvelle route.*
