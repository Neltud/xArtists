# Sonde publique — 24 novembre 2026 (05:33 UTC)

Lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé. Les chiffres ci-dessous sont ceux observés à cet instant, pas une promesse sur le cycle suivant.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · SHA **`5271cefe14ac32f704a42c551c1ced5917d1edd2`** · construit `2026-11-23T17:19:23.449Z` · 140 routes · `lia_live_trading=false` · workflow [45226192675](https://github.com/Neltud/xArtists/actions/runs/45226192675) |
| API Render | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` · `lia_live_trading="0"` · checkout Stripe/MoonPay **off** · PayBox `mode=prod` mais `paybox_checkout_enabled=false` · mint live **off** (dry-run) · enchères **off** · upload studio **off** · `tro_solana_bridge=off` |
| `api.xartists.art` | **non résolu** |
| Studio store | HTTP **503** · `table_ready=false` · `schema_ready=false`. La page `/studio/` sert le shell Pages (HTTP 200), pas le schéma. |
| xOrus hub | HTTP 200 · sandbox · source runtime `e580388b53d65da6f10f86bab37527215f5072f3` · `execution_authorized=false` · `trading_enabled=false` · `signing_authorized=false` · `stance=ABSTAIN` · `linked_wallets=0` · inférence **non** configurée |
| Paper | manifeste `/v1/xorus/paper` 200 · `valuation=manual_hypothetical_reference` · registre live **absent** · commandes sans token **401** |
| Politique | `/v1/xorus/risk-policy` 200 · `live_budget_cents=0` · `status=reference_policy_execution_disabled` |
| Agents | `/v1/xorus/agents` 200 · observateurs MultiversX + Solana · pas une preuve de quote |
| CI main | smokes planifiés du 24 nov (GO public, Pages SHA, mint dry-run, ops SC) en **success** au moment de la lecture. Ce n'est pas un GO commercial. |

## Ce qui est live, et ce qui ne l'est pas

Le site public est **live** sur le cockpit V2 ([PR #633](https://github.com/Neltud/xArtists/pull/633)). Le commerce ne l'est pas. L'API Render reste en retard sur `main` : un push git ne la redéploie pas.

## Suite logique — pas un GO trading

1. Quotes : schéma d'admission seulement (`/v1/xorus/reference-quotes`), **sans flux et sans déploiement Neon** dans cette sonde. Un prix public n'est pas un fill.
2. Registre de risque live : non implémenté. Ne pas le confondre avec le journal paper.
3. Signature : toujours un wallet utilisateur distinct (xPortal / #506) avant tout listing (#428).
4. Studio : migrations après backup, pas avant.
5. `LIA_LIVE_TRADING`, checkout PayBox, mint live et assisted POST restent interdits tant que les preuves humaines manquent.

## Veille datée (contexte, pas un signal de trade)

- MultiversX : composants publics opérationnels le 24 nov 2026 ~03:48 UTC (suivi d'état tiers). TVL DeFi agrégée lue vers **10,77 MUSD**, EGLD vers **2,26 USD** (DefiLlama, même jour). Ce n'est pas une valorisation xArtists et pas une autorisation de swap.
- Hatom concentre l'essentiel de ce TVL (~9,98 MUSD). xExchange ~3 MUSD, volume DEX 24 h ~162 kUSD. Liquidité fine : un orchestrateur qui « optimise le yield » sur cette base glisserait. Abstention reste le défaut.
- Supernova (consensus découplé de l'exécution, blocs ~600 ms) est documenté **testnet/devnet** depuis août 2026. Cette sonde ne confirme pas une activation mainnet. Ne pas router de valeur dessus.
- PayBox reste configuré côté API et **fermé** au checkout. MoonPay et Stripe restent off. Apple Pay / Google Pay ne sont pas un signer on-chain.
