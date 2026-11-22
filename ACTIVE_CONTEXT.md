# ACTIVE_CONTEXT — xArtists / xOrus

## Mesure publique — 22 novembre 2026 (05:33 UTC)

Sonde lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé. Détail : [`docs/ops/PROBE_PUBLIC_2026-11-22.md`](docs/ops/PROBE_PUBLIC_2026-11-22.md).

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · SHA **`d5f1140e`** servi avant ce correctif de titre · construit `2026-11-21T16:39:57Z` · 140 routes · `lia_live_trading=false` |
| API Render | HTTP 200 · SHA `8b6fae84` · checkout / mint live / upload / enchères **off** · PayBox prod **sans** checkout |
| `api.xartists.art` | **NXDOMAIN** |
| Studio | HTTP **503** · schéma absent |
| xOrus | `paper_only` · **ABSTAIN** `thin_tape` · 6/120 · `2026-11-22T05:33:03Z` |
| Hub Neon | sandbox lecture seule · 0 wallet · pas l'API de prod |
| Code | Titre public xOrus novice sur `main` (`8140bae9`) et sur [PR #626](https://github.com/Neltud/xArtists/pull/626). Exposition HTML après `ux-local` vert. Aucun gate finance. |

Le site public était `d5f1140e` au moment de la sonde. Le commerce ne l'est pas. Le titre xOrus part avec le prochain build Pages.

## Passerelle plateformes — 21 novembre 2026 (16:34 UTC)

`xorushub` est déployé sur **Neon Free**, dans `xartists-access-sandbox` uniquement. Une seule organisation logique `xartists` ; aucun compte fournisseur ni wallet fusionné. Source runtime `825292a7ef2e397d98d9cfdf34065dc99f11ac72` ; [PR #625](https://github.com/Neltud/xArtists/pull/625).

- [Health HTTPS](https://br-steep-sun-bab7l93p-xorushub.compute.c-8.eu-central-1.aws.neon.tech/health) et registre `/v1/xorus/platforms` répondent 200. Cette fonction n'est pas `access-api`.
- Livraison native Neon prouvée à **16:34:00 UTC** ; reçu persistant à 16:34:01 UTC. Quatre endpoints **techniques** atteints : Bitcoin, Solana, Polymarket, Kraken. Aucun prix ou signal de marché collecté.
- Trigger `xorus-hub-hourly` actif, cron final `17 * * * *` UTC.
- **Zéro wallet lié**, signatures externes non implémentées, exécution fermée, stance ABSTAIN.

Preuve : [`deploy/neon/xorus-hub/deployment-receipt-20261121.json`](deploy/neon/xorus-hub/deployment-receipt-20261121.json).

## Mesure publique — 20 novembre 2026 (~18:54 UTC)

Historique. Pages `9610b56`, API `8b6fae84`, studio 503, commerce fermé. Détail : [`docs/ops/PROBE_PUBLIC_2026-11-20.md`](docs/ops/PROBE_PUBLIC_2026-11-20.md).

## Garde-fous

Aucun paiement, mint, trading live, transfert ou migration prod n'est activé par le correctif de titre. `LIA_LIVE_TRADING` reste interdit. PayBox configuré n'est pas un encaissement.
