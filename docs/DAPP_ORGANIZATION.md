# xArtists — Organisation complète de la dApp

**Réseau :** MultiversX mainnet · **$TRO** max 500 000 · **Private release**  
**Repo :** Neltud/xArtists · Pages `/xArtists/`

---

## 1. Vision

dApp **art phygital + agents IA + DeFi MVX** : users publient / collectionnent ; **LIA** (Vellum) opère paper-first une treasury de fondation — **pas** un fonds LP public.

---

## 2. Deux acteurs

| | **Utilisateur** | **LIA (protocole)** |
|--|-----------------|---------------------|
| Wallet | xPortal / Web / extension | Ops `erd1p4zyy…lerqu0crn6` |
| UI | Connect, List, Buy, Tip, Studio | Board, Portfolio LIA, Trading paper |
| Interdit | Login avec adresse LIA | Signer à la place de l’user |

**Wallet** = portefeuille user · **Portfolio** = positions LIA · **Packs** ≠ **GreenSmoke**

---

## 3. Routes

### Principales
| Route | Rôle |
|-------|------|
| `/` | Dashboard, status, persona |
| `/studio` | Création / pin IPFS / mint prep |
| `/gallery` | Catalogue NFT (index + virtual) |
| `/marketplace` | List/Buy/Bid — TX si SC live |
| `/agents` | Packs sub-agents — Buy si SC |
| `/wallet` | Solde **user** |
| `/portfolio` | Positions **LIA** |
| `/trading` | Board, modes, paper |
| `/dao` | $TRO — lecture seule tant que vote TX absent |
| `/tip` | Don protocole |
| `/tro` `/staking` | Token / stake |
| `/hatom` `/lp` | Yield / pools |
| `/editions` `/ads` | Lettre / pub enchères MVP |

### Expérimental
`/soul-testnet` · `/burnify` · `/agents/polylia` — isolés, pas de fonds users sur experimental.

### BottomNav mobile
Home · Studio · Market · Agents · LIA · Wallet

### TxShell (sdk-dapp)
`/marketplace` `/studio` `/agents` `/tip` `/wallet` `/staking` `/tro` (+ polylia)

---

## 4. Architecture

```text
FRONTEND (React/Vite) → DATA JSON (public/data)
       ↑ publish
LIA Python (pipeline, guardian, swarm, oracles, security)
       ↑
Vellum Timer → pipeline → mirror
       ↓
SC MultiversX (nft-market, agents-market, staking, …)
```

---

## 5. Modules LIA

| Zone | Rôle |
|------|------|
| `lia/vellum/pipeline` | Cycle v1.3 paper-first |
| guardian / risk | PreFlight, trailing, locks |
| circuit / agents | compound, swarm, million_columns |
| oracles | prix MVX |
| security | go_live_gates, micro_proofs |
| policy/esdt_universe | tokens tradables |
| media | Pinata / IPFS |

Flags : `CHAIN=1` · `LIA_LIVE_TRADING=0` jusqu’aux preuves.

---

## 6. Smart contracts (réel)

| SC | État |
|----|------|
| agents_marketplace | **null** — Buy agent off |
| marketplace NFT | adresse, **codeHash null** — ne pas envoyer fonds |
| nft_staking / tro_governance / nft_minter | adresses listées |
| rwa_escrow_bridge | null — P2 |

Fee agents cible : **3 %** (FEE_BPS=300).

---

## 7. Flux d’argent (cible)

Buy → seller + fee SC · Tips → Mission/Reserve/Ops · PnL LIA live seulement si gates · $TRO utility (max 500k).

---

## 8. JSON front

`contracts.json` · `lia_board.json` · `lia_v6_status.json` · `oracle_prices.json` · `vellum_last_run.json` · `xartists_collections.index.json` · `agents_catalog.json` · `greensmoke_forecasts.json` · `desk_last.json`

---

## 9. Matrice private release

| Capacité | État |
|----------|------|
| Gallery / Dashboard / Board paper | ✅ |
| Pin IPFS ops | ✅ |
| Connect user (pas LIA) | ✅ |
| List/Buy/Bid on-chain | ❌ |
| Buy agent | ❌ |
| Vote DAO TX | ❌ |
| LIA live | ❌ |
| LIA paper | ✅ |

---

## 10. Priorités

**P0** Deploy agents + nft market · codeHash · signature user · micro-proofs  
**P1** Index listings · Studio pin auto · Mission/Reserve  
**P2** Soul prover · bridge · multisig · audit  

---

## 11. Vellum

Prompt : `docs/VELLUM_PRIVATE_RELEASE_PROMPT.md`  
Nodes : `data/vellum_workflow_nodes_private.json`  
Adapters : `data/vellum_strategy_adapters.json`  

Timer → … → Guardian → paper stack → mirror · **Deploy SC hors timer**

---

## 12. Glossaire

**LIA** agent protocole · **GSN** prévisions · **Sub-agent** pack vendu · **codeHash** SC réellement déployé · **Paper** sans broadcast · **Private release** early access sans claim market live.
