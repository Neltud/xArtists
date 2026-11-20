# Sonde publique — 20 novembre 2026 (~18:54 UTC)

Lecture seule. Aucun drapeau commerce, mint ou trading n'a été modifié.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · `fdd072190d0af7e7dbb7386b301b14ac218c9373` · `built_at=2026-11-17T13:54:38Z` · 140 routes · `lia_live_trading=false` |
| Home / marketplace | HTTP 200 · `server: GitHub.com` · `last-modified` 17 nov 2026 |
| API Render `/health` | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` · `lia_live_trading=0` · checkout, mint live, upload, enchères, OpenSea execution, xOrus privé **off** · `mint_dry_run=true` · `paybox_configured=true` mais `paybox_checkout_enabled=false` |
| Studio store | HTTP **503** · postgres · tables / schémas absents |
| `xartists.art` | A GitHub Pages (`185.199.108–111.153`) |
| `api.xartists.art` | **NXDOMAIN** — pas l'API publique |
| MX | `1 mail.xartists.art.` — existence DNS, pas une preuve de réception `hello@` |

`main` était **63 commits** devant le SHA servi. Le workflow Pages du 19 nov (`518cbb7`, run `44530069139`) a échoué : 6 tests `test:release` attendaient encore le bootstrap live LIA (0,001 EGLD, plafonds USD, ESDT éligibles) alors que `liaConfig` est paper-only depuis le 17 nov. Les commits suivants portaient `[skip ci]` et n'ont pas relancé le déploiement.

Correctif : les tests attestent désormais le retrait (aucun actif éligible, preflight refusé, bureau xOrus paper). Le commerce reste NO-GO.
