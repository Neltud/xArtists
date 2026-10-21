# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

**Status (2026-10-21): site SC live · pulse /go-live · LIA client paper · slot non payable · listing #2 actif**

- Bundle stamp **0.118.0** (`static.yml`). `VITE_LIA_LIVE_TRADING=0`.
- Probe **21 oct ~04:35 UTC**, epoch **2269**, refreshRate 600. CodeHash agents inchangé.
- Prix packs : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice`). Fiat **110 / 75 / 50** €, Paybox **fermé** (501).
- Market `isPayable=true`, **0,0175 EGLD**. Listing **#1 inactif**. Listing **#2 actif** ASFT **0,25 EGLD**, bid **0,01**.
- Slot house **0,5000 EGLD**, `isPayable=false`. REAL spin fermé.
- LIA Ops **1,585598 EGLD**, nonce **1479** (figé depuis les swaps du 17 oct). **Client paper.**
- EGLD **~$3,73** · mcap ~$115,6M · staked ~14,27M · APR ~8,86 %.
- $TRO `TRO-94c925` circ **476 224** · **562** comptes · ~$0,000084 · mcap ~$40.
- **Upbit + Bithumb** : fenêtre **19–23 oct** en cours (jour 3). EGLD pas dans les delist décidés (SOPH/ZIL, 16 nov). Pas de trade live.
- Treasury dest **null** — ne pas router les frais.
- `ci-cd.yml` désactivé. Go-live site = `static.yml`.
- Legacy empty placeholders must **never** receive funds.
- Not a retail investment fund. Tips ≠ investment. User Connect ≠ LIA Ops.

Recap + veille (21 oct) : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
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
| **$TRO** | Utility token — max supply product 500 000 · circ ~476 224 · API ~$0.000084 |
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
