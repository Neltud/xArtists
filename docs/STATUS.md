---
hidden: true
noIndex: true
---

# Status — probe live 2026-11-16T05:33Z

| Item | State |
| --- | --- |
| Verdict site | **GO_LIVE SITE** (exploration, musée, xOrus paper) |
| Verdict commerce | **NO-GO** (mint live, fiat, trading autonome). Un go-live total commercial est refusé |
| Release Pages | **0.139.0** · SHA `5bf83162852840b6331f42ce1f59db4224e79a2c` · built `2026-11-15T15:21:23.194Z` · 140 routes · `lia_live_trading=false` |
| API Render | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` (14 nov 05:04 UTC) · **en retard** |
| Demo | https://xartists.art/ · www **301** vers l'apex · https://neltud.github.io/xArtists/ |
| LIA / xOrus trade | paper · ABSTAIN `thin_tape` · `live_trading=false` |
| Studio upload | **OFF** · diagnostic store **HTTP 503** · `table_ready=false` · raison SQL non exposée |
| Mint | `mint_live_enabled=false` · `mint_dry_run=true` · `mint_dispatch_enabled=false` · `mint_oidc_pull_enabled=true` (lecture seule) |
| Stripe / MoonPay | non configurés live |
| PayBox | configuré · `paybox_mode=prod` · checkout **disabled** |
| Marketplace | lecture publique · cycle listing/achat **non prouvé** (#428) |
| xPortal | **NO-GO preuve** (#506) — allowlist Reown, pas un patch |
| Treasury dest | **null** historique — do not claimFees · non relu on-chain |
| Recap | [`ANALYSE_DAPP_COMPLETE.md`](ANALYSE_DAPP_COMPLETE.md) · [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md) · [`../ACTIVE_CONTEXT.md`](../ACTIVE_CONTEXT.md) |

Hard refresh: Ctrl+Shift+R. Toujours relire [build-info.json](https://xartists.art/build-info.json) et [API health](https://xartists-access-api.onrender.com/health) avant une décision d'activation. Ce fichier ne lève aucun gate.
