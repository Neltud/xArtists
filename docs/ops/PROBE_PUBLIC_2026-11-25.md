# Sonde publique — 25 novembre 2026 (~05:40 UTC)

Lecture seule. Aucun drapeau commerce, mint ou trading n’a été modifié. Aucun déploiement Neon n’a été lancé.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · `source_sha` **`c051d9868dbe06c8f7f568a994351c3b0c368ca1`** · construit `2026-11-24T16:26:50.687Z` · 140 routes · `lia_live_trading=false` |
| Tip `main` | `f321e35425244cbb6713bc620b7e902b7e3368cb` au moment de la lecture (commits data après le build Pages) |
| API Render | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` · checkout, mint live, enchères, upload, pont $TRO **off** · PayBox `configured=true` `mode=prod` `checkout_enabled=false` |
| `api.xartists.art` | **NXDOMAIN** |
| Studio store | HTTP **503** · `table_ready=false` · `schema_ready=false` |
| Hub Neon | HTTPS 200 · source `e580388b53d65da6f10f86bab37527215f5072f3` · `execution_authorized=false` · `trading_enabled=false` · `linked_wallets=0` · stance **ABSTAIN** |
| `GET /v1/xorus/reference-quotes` | HTTP **404** sur le runtime servi. Le schéma est dans `main`, pas dans le bundle déployé. |

MultiversX : composants publics opérationnels au 25 novembre 2026 (pas une preuve de listing ni de session xPortal).

## Ce que cette sonde n’autorise pas

- `LIA_LIVE_TRADING`, `paybox_checkout_enabled`, mint public, assisted POST.
- Traiter un catalogue, un prix EGLD lu en public, ou une quote admise comme un fill.
- Annoncer le commerce ouvert. Les bloquants humains restent [#506](https://github.com/Neltud/xArtists/issues/506), [#428](https://github.com/Neltud/xArtists/issues/428), [#341](https://github.com/Neltud/xArtists/issues/341) et les migrations Studio après backup.

## Suite de code retenue

1. Afficher le schéma d’admission dans le bureau xOrus **sans appeler** le hub (la route live est 404).
2. Fermer le client WalletConnect d’un relais abandonné avant d’en ouvrir un autre. Le correctif upstream 6.2.0 (init unique, QR qui reste initialisé) n’est pas dans le provider 5.0.2 servi ici ; le bump majeur n’est pas pris sans campagne de tests dédiée.
3. Ne pas remplacer le bundle Neon tant qu’un reçu de déploiement n’est pas écrit.
