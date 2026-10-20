# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

**Status (2026-10-20): GO_LIVE SC · pulse live sur /go-live · LIA client paper · slot non payable · listing #2 actif**

- Bundle stamp **0.117.0** (`static.yml`). `VITE_LIA_LIVE_TRADING=0`.
- Probe **20 oct ~04:40 UTC**, epoch **2268**, refreshRate 600. CodeHash agents = `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`
- Prix packs inchangés : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD. Fiat catalogue **110 / 75 / 50** €, Paybox **fermé** (501).
- Market `isPayable=true`. Listing **#1 inactif**. Listing **#2 actif** ASFT **0,25 EGLD**, bid **0,01**. Balance **0,0175 EGLD**
- Slot house **0,5000 EGLD**, `isPayable=false`, min bet **0,001**. REAL spin fermé
- LIA Ops **~1,5856 EGLD**, nonce **1479**. Le 17 oct ~13:00 UTC le wallet ops a signé wrap / addLiquidity / swap / multiPairSwap. Le **client** reste paper. Pas de nouveau live pendant la fenêtre Upbit.
- EGLD **~$3,65** API · mcap ~$113,1M · staked ~14,27M · APR ~8,87 %
- $TRO circ **476 224** · **562** comptes · ~$0,000083 · mcap ~$40
- **Upbit** : EGLD toujours en surveillance (depuis 21 sept). Fenêtre de décision **19–23 oct 2026** — pas de delist annoncé à cette sonde (SOPH/ZIL delist 16 nov, pas EGLD).
- Treasury dest **null** — ne pas router les frais
- `ci-cd.yml` désactivé. Go-live = `static.yml`
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
