# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

Publication du 25 octobre : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md).  
La revue coréenne est **prolongée** (Upbit notice 207379109, 16–20 nov). Le site est en ligne. Le trading ne l’est pas.

**Vellum · mise à jour LIA Wallet :**
[`docs/VELLUM_LIA_WALLET_DIRECTIVES.md`](docs/VELLUM_LIA_WALLET_DIRECTIVES.md)
— directives MultiversX / PayBox, stratégies, validations des ordres réels et
critères de livraison. Spécification de mise à jour ; aucune activation live.

**Dernier état GitHub Pages visé par ce push (2026-10-25) : site public en lecture · LIA client paper · prolongation KR · slot non payable**

- Bundle stamp **0.121.0** (`static.yml`). `VITE_LIA_LIVE_TRADING=0`.
- Probe **25 oct ~04:45 UTC**, epoch **2273**, refreshRate 600. CodeHash agents inchangé.
- Prix packs : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice`). Fiat **110 / 75 / 50** €, Paybox **fermé** (501).
- Market **0,0175 EGLD**. Listing **#2** reste la seule cible d’achat (ASFT). Ne pas acheter l’id **#1**.
- Slot house **0,5000 EGLD**. REAL spin fermé.
- LIA Ops **1,585598 EGLD**, nonce **1479** (figé depuis les swaps du 17 oct). Le snapshot du 17 oct (nonce 1473) n’est plus servi.
- EGLD **$3,30** · mcap ~$102,4M · staked ~13,92M · APR ~9,07 %.
- $TRO `TRO-94c925` circ **476 224** · **562** comptes · ~$0,0000807 · mcap ~$38.
- **Upbit + Bithumb** : warning **prolongé jusqu’au 16–20 nov 2026**. **22 jours** avant le 16 nov. Pas de trade live.
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
