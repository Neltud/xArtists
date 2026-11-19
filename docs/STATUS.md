---
hidden: true
noIndex: true
---

# Status — probe live 2026-11-19T12:25Z

| Item | State |
| --- | --- |
| Verdict site | **GO_LIVE SITE** (exploration, musée, xOrus paper) |
| Verdict commerce | **NO-GO** (mint live, fiat, trading autonome). Un go-live total commercial est refusé |
| Release Pages | **0.139.0** · SHA `fdd072190d0af7e7dbb7386b301b14ac218c9373` · built `2026-11-17T13:54:38.043Z` · 140 routes · `lia_live_trading=false` |
| Bundle API origin | `https://xartists-access-api.onrender.com` only (`api.xartists.art` absent du JS / CSP) |
| API Render | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` · **en retard** sur Pages · `execution_authorized=false` |
| Cutover `api.xartists.art` | **NXDOMAIN** — pas un GO · smoke public sonde Render + note le cutover à part (commit `e2a9fdd`) |
| Demo | https://xartists.art/ · www CNAME `neltud.github.io` · https://neltud.github.io/xArtists/ |
| LIA / xOrus trade | paper · régime `observe` (fallback 19 nov) · `live_trading=0` · exécution disabled |
| Studio upload | **OFF** · diagnostic store **HTTP 503** · `table_ready=false` · raison SQL non exposée |
| Mint | `mint_live_enabled=false` · `mint_dry_run=true` · `mint_dispatch_enabled=false` · `mint_oidc_pull_enabled=true` (lecture seule) |
| Stripe / MoonPay | non configurés live |
| PayBox | configuré · `paybox_mode=prod` · checkout **disabled** |
| Marketplace | lecture publique · cycle listing/achat **non prouvé** (#428) |
| xPortal | **NO-GO preuve** (#506) — allowlist Reown, pas un patch |
| Mail MX | `1 mail.xartists.art.` · A `146.59.146.223` · réception `hello@` **non prouvée** (#341) |
| Treasury dest | **null** historique — do not claimFees · non relu on-chain |
| Recap | [`ops/PROBE_PUBLIC_2026-11-19.md`](ops/PROBE_PUBLIC_2026-11-19.md) · [`ANALYSE_DAPP_COMPLETE.md`](ANALYSE_DAPP_COMPLETE.md) · [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md) · [`../ACTIVE_CONTEXT.md`](../ACTIVE_CONTEXT.md) |

Hard refresh: Ctrl+Shift+R. Toujours relire [build-info.json](https://xartists.art/build-info.json) et [API health](https://xartists-access-api.onrender.com/health) avant une décision d'activation. Ce fichier ne lève aucun gate.
