# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

**Status (2026-10-17): GO_LIVE SC · build Pages réparé · LIA paper · slot non payable · listing #2 actif**

- `static.yml` était rouge depuis le 16 oct (`buildUserSignPayload` manquant) — le site public restait sur **0.111.0**. Corrigé : export + bundle stamp `0.113.0`, `VITE_LIA_LIVE_TRADING=0`.
- Product SCs re-sondés **17 oct 2026**, epoch **2265**, refreshRate 600. CodeHash agents = upgrade `buyPack` : `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`
- Runtime SMART-UNLOCK + match explorer → `canBuyAgent()` OK sans secret Pages. Prix officiels : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD
- Agents SC **0,013 EGLD** = essais micro, pas des ventes 10/5/2.5
- Market `isPayable=true`. Listing **#1 inactif**. Listing **#2 actif** ASFT à **0,25 EGLD**, bid **0,01**. Balance **0,0175 EGLD**
- Slot house **0,5000 EGLD**, `isPayable=false`, min bet **0,001**, spin count 0. REAL spin fermé
- LIA Ops **1,6038 EGLD**, nonce **1473**, trading **paper**
- EGLD **$3,70** API · mcap ~$114,6M · circ 30,98M · staked 14,27M · APR ~8,88%
- $TRO circ **476 224** · **562** comptes · ~$0,000080 · mcap ~$38
- Upbit : EGLD **investment warning** depuis 21 sept · décision **19–23 oct 2026**
- Treasury dest **null** — ne pas router les frais
- `ci-cd.yml` (wipe docs + deploy vide) **désactivé**. Go-live = `static.yml`
- Legacy empty placeholders must **never** receive funds
- Not a retail investment fund. Tips ≠ investment. User Connect ≠ LIA Ops.

Recap + veille (17 oct) : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
Suite logique : [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md)  
**Audit Grok (deep pass)** : [`docs/AUDIT_GROK_2026-10-17.md`](docs/AUDIT_GROK_2026-10-17.md)  
Demo : https://neltud.github.io/xArtists/#/demo · GO_LIVE : https://neltud.github.io/xArtists/#/go-live

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections (NFTUDURI live via API) |
| **Marketplace** | List / Buy / Bid — listing #2 actif 0,25 EGLD (ne plus acheter l’id #1) |
| **Agents** | Limited LIA sub-agent packs (Pulse · Yield · Sentinel) |
| **LIA** | Autonomous agent (Guardian → Brain → paper until micro-proofs) |
| **$TRO** | Utility token — max supply product 500 000 · circ ~476 224 · API ~$0.000080 |
| **Slot** | Primordial Slot — house 0,5 EGLD, REAL fermé (`isPayable=false`) |

Not a retail investment fund. Tips ≠ investment.

---

## Environment variables

Full reference: **[`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md)**  
Frontend template: [`apps/frontend/.env.example`](apps/frontend/.env.example)

```bash
# Never commit VITE_*_CODEHASH_OK=1 — runtime explorer match is the unlock.
# LIA_LIVE_TRADING=0 until Upbit clarity + Guardian + micro-proofs.
```

---

## License

MIT · See [LICENSE](LICENSE)
