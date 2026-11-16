# ACTIVE_CONTEXT — xArtists / xOrus

## Mise à jour opératoire — 16 novembre 2026 (05:33 UTC)

**Ce bloc remplace les chiffres des instantanés plus anciens.** Toute décision relit les endpoints frais. Aucune documentation, aucune CI et aucun push n'autorisent le commerce.

### Probe live

- **Pages** : [xartists.art/build-info.json](https://xartists.art/build-info.json) → `release_version=0.139.0`, `source_sha=5bf83162852840b6331f42ce1f59db4224e79a2c` (correctif header mobile, 15 nov 15:20 UTC), `presentation_source_sha=8a607c8831234fe738a091a5a4caf325811c1b5b`, `lia_live_trading=false`, `public_route_count=140`, `built_at=2026-11-15T15:21:23.194Z`, run [43729330425](https://github.com/Neltud/xArtists/actions/runs/43729330425). `www.xartists.art` répond **301** vers l'apex.
- **HEAD git** au moment de la sonde : `af853c7ac0e83cd9fd16876e2048d0e6f58540be` (`chore(news)` `[skip ci]`, 16 nov 00:46 UTC). Pages ignore ces commits markdown/news. Le site public sert le dernier commit frontend, pas le tip news.
- **API** : [health](https://xartists-access-api.onrender.com/health) → HTTP 200, `ok=true`, `source_sha=8b6fae84e15084883d94e2121a7ab8f6219b7845` (commit `chore(news)` du **14 nov 05:04 UTC**). L'API reste **en retard** sur les Pages (~34 h) et encore plus sur `main`. `lia_live_trading=0`, `mint_live_enabled=false`, `mint_dry_run=true`, `mint_dispatch_enabled=false`, `mint_oidc_pull_enabled=true` (lecture, pas une exécution), `studio_media_upload=off`, Stripe off, MoonPay off, `paybox_configured=true`, `paybox_mode=prod`, **`paybox_checkout_enabled=false`**, `walletless_account_session_enabled=false`, `xorus_private_analysis_enabled=false`, `auction_enabled=false`, `tro_solana_bridge=off`, `orders_backend=postgres`, `physical_works=off`, `artprice_records_enabled=false`.
- **CORS** : `https://xartists.art` et `https://neltud.github.io` reçoivent `Access-Control-Allow-Origin` exact. `https://evil.example` n'en reçoit pas. `www` n'a pas de grant CORS : inutile tant que le 301 apex tient.
- **Studio** : [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) → **HTTP 503**, `backend=postgres`, `table_ready=false`, `schema_ready=false`, `model_schema_ready=false`. Le corps public n'expose **pas** de code `migration_004_missing` (contrat volontaire : raison seulement dans les logs Render). On ne réaffirme donc pas la cause SQL. Upload interdit.
- **xOrus** : [analysis](https://xartists-access-api.onrender.com/v1/xorus/analysis) → HTTP 200, `mode=paper_only`, `decision=ABSTAIN` / `thin_tape`, `generated_at=2026-11-16T05:33:26Z`, `source_ts=2026-11-16T04:59:59Z`, 120 signaux définis / 6 analysés, `executable=false`, `live_trading=false`. Instrument public Binance `EGLDUSDT` 1h, non attesté.
- **Upbit** : la fenêtre de la notice `207379109` (prolongation du 23 oct) est **ouverte aujourd'hui**, 16–20 novembre 2026. Aucune levée officielle relue. Ce n'est pas un GO.

### Verdict

| Surface | Verdict |
| --- | --- |
| Site / musée / exploration / xOrus paper | **GO_LIVE** (déjà servi en 0.139.0) |
| Trading autonome LIA / xOrus | **NO-GO** |
| Mint live / fiat (Stripe, MoonPay, checkout PayBox) | **NO-GO** |
| Studio upload IPFS | **NO-GO** (503, schéma non prêt) |
| Buy / Bid / Offer public | **NO-GO** jusqu'au cycle complet (#428) |
| « Go-live total » commercial | **REFUSÉ** |
| Alignement API Render sur le SHA des Pages | **À FAIRE**, sans lever de drapeau |

### Prochain ordre

1. Certifier Reown / xPortal + wallet signataire (#506). Allowlist dashboard, pas un nouveau patch.
2. Prouver PostgreSQL Studio : identifier l'hôte du `DATABASE_URL` runtime (**sans coller le secret**), backup / restore, migrations 004 puis 005 puis 006 si GLB, CID relu. Le code raison est dans les logs, pas dans le JSON public.
3. Redéployer l'API Render depuis `main` **sans** modifier `PAYBOX_*`, `MINT_*`, `LIA_*` ni `CREATOR_MEDIA_UPLOAD_ENABLED`.
4. Démontrer un **nouveau** listing signé → achat → receipt Explorer (#428), seulement après #506.
5. Compte email + droits xOrus privés serveur (#548).
6. Un seul rail de paiement après webhook, révocation et cadre légal. OVH reste parallèle, sans bascule DNS.

**Sécurité :** ce document n'autorise aucun changement de drapeau financier, de signature, de mint, de trade, de DNS, de paiement ou de migration de production.

---

## Archive — 15 novembre 2026 (05:35 UTC)

Périmée pour les SHA. Pages étaient alors citées en `7b280cc` / 14 nov 18:48 UTC. Le correctif header mobile `5bf83162` a été construit le 15 nov à 15:21 UTC. Les garde-fous tiennent : pas de `claimFees` (destination trésorerie historiquement nulle, non relue on-chain), pas de recharge LIA Ops, incident du **30 oct 2026** comme référence, PayBox fail-closed sur le checkout.

## Archive — 14 novembre 2026 (05:45 UTC)

Périmée pour les versions. Pages étaient alors en **0.138.0** / `ccf25e51`.

Voir [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md), [`docs/STATUS.md`](docs/STATUS.md), [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md), [`docs/security/launch-gates.md`](docs/security/launch-gates.md).
