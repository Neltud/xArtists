# ACTIVE_CONTEXT — xArtists / xOrus

## Mise à jour opératoire — 15 novembre 2026 (05:35 UTC)

**Ce bloc remplace les chiffres des instantanés plus anciens.** Toute décision relit les endpoints frais. Aucune documentation, aucune CI et aucun push n'autorisent le commerce.

### Probe live

- **Pages** : [xartists.art/build-info.json](https://xartists.art/build-info.json) → `release_version=0.139.0`, `source_sha=7b280ccf29765ec7660451559d8a1b453fb79d4a`, `presentation_source_sha=8a607c8831234fe738a091a5a4caf325811c1b5b`, `lia_live_trading=false`, `public_route_count=140`, `built_at=2026-11-14T18:48:35.921Z`. Ce build est celui qui isole les originaux Drive du catalogue NFT.
- **API** : [health](https://xartists-access-api.onrender.com/health) → HTTP 200, `ok=true`, `source_sha=8b6fae84e15084883d94e2121a7ab8f6219b7845` (commit `chore(news)` du **14 nov 05:04 UTC**, en retard sur les Pages). `lia_live_trading=0`, `mint_live_enabled=false`, `mint_dry_run=true`, `mint_dispatch_enabled=false`, `mint_oidc_pull_enabled=true` (bras de lecture, pas une exécution), `studio_media_upload=off`, Stripe off, MoonPay off, `paybox_configured=true`, `paybox_mode=prod`, **`paybox_checkout_enabled=false`**, `walletless_account_session_enabled=false`, `xorus_private_analysis_enabled=false`, `auction_enabled=false`, `tro_solana_bridge=off`, `orders_backend=postgres`, `physical_works=off`, `artprice_records_enabled=false`.
- **Studio** : [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) → **HTTP 503**, `backend=postgres`, `table_ready=false`, `schema_ready=false`, `model_schema_ready=false`. Upload interdit.
- **Fenêtre Upbit** : la notice du 23 oct 2026 (`207379109`) court jusqu'au **16–20 novembre**. Aucune levée n'a été relue le 15 nov au matin. Ce n'est pas un GO.

### Verdict

| Surface | Verdict |
| --- | --- |
| Site / musée / exploration / xOrus paper | **GO_LIVE** |
| Trading autonome LIA / xOrus | **NO-GO** |
| Mint live / fiat (Stripe, MoonPay, checkout PayBox) | **NO-GO** |
| Studio upload IPFS | **NO-GO** (503, schéma absent) |
| Buy / Bid / Offer public | **NO-GO** jusqu'au cycle complet (#428) |
| Alignement API Render sur le SHA des Pages | **À FAIRE**, sans lever de drapeau |

### Prochain ordre

1. Certifier Reown / xPortal + wallet signataire (#506).
2. Prouver PostgreSQL Studio : backup / restore, migrations 004–006, CID relu.
3. Démontrer un **nouveau** listing signé → achat → receipt Explorer (#428).
4. Compte email + droits xOrus privés serveur (#548).
5. Un seul rail de paiement après webhook, révocation et cadre légal.
6. Aligner l'API (`8b6fae84`) sur les Pages (`7b280cc`), puis OVH seulement en parallèle.

**Sécurité :** ce document n'autorise aucun changement de drapeau financier, de signature, de mint, de trade, de DNS, de paiement ou de migration de production.

---

## Archive — 14 novembre 2026 (05:45 UTC)

Périmée pour les versions. Pages étaient alors en **0.138.0** / `ccf25e51`. Les garde-fous tiennent toujours : pas de `claimFees` (destination trésorerie nulle), pas de recharge LIA Ops, incident du **30 oct 2026** comme référence, PayBox fail-closed sur le checkout, slot REAL non payable.

Voir [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md), [`docs/STATUS.md`](docs/STATUS.md), [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md), [`docs/security/launch-gates.md`](docs/security/launch-gates.md).
