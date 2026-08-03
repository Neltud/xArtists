# dApp links + Vellum novelties

## Canonical links

Source of truth: `apps/frontend/src/config/links.ts` + `data/LINKS_CANONICAL.json`

| Link | URL |
|------|-----|
| dApp | https://neltud.github.io/xArtists/ |
| GitHub | https://github.com/Neltud/xArtists |
| Explorer | https://explorer.multiversx.com |
| Wallet | https://wallet.multiversx.com |
| xExchange | https://xexchange.com |
| OneDex | https://onedex.app |
| Hatom | https://app.hatom.com |
| XOXNO | https://xoxno.com |
| GreenSmoke | https://app.greensmoke.network/agents |
| Midjourney | https://www.midjourney.com |

**Removed from primary UX:** Soul in main nav; `docs.hatom.com` as primary doc link; Burnify internal file paths as user links.

## Primary vs experimental routes

- **Primary:** Dashboard, Agents, Marketplace, Gallery, Trading, Portfolio, TRO, Hatom, LP, Staking, DAO, Wallet, Tip
- **Experimental (routed, not nav):** `/soul-testnet`, `/burnify`, `/agents/polylia`

## Midjourney on Vellum

```python
from lia.vellum.nodes_midjourney import run
return run(theme="xArtists gallery drop", post_webhook=False)
```

Optional secret: `MIDJOURNEY_WEBHOOK_URL` (Discord) — never commit.

Professional model = structured prompt packs (gallery / performance / NFT cover), not live MJ API (none in-repo).

## Orchestrator stack (reminders)

`lia.vellum.orchestrator` + hatom publish + `nodes_midjourney` for art drops.
