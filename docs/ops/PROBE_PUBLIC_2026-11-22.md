---
hidden: true
noIndex: true
---

# Sonde publique — 22 novembre 2026 (05:33 UTC)

Lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé.

| Surface | Observé |
| --- | --- |
| Pages [build-info.json](https://xartists.art/build-info.json) | **0.139.0** · SHA **`d5f1140eefb46a54f13bc999a028d375161d5e3b`** · `built_at=2026-11-21T16:39:57Z` · 140 routes · `lia_live_trading=false` · run [44925740270](https://github.com/Neltud/xArtists/actions/runs/44925740270) |
| API Render [/health](https://xartists-access-api.onrender.com/health) | HTTP 200 · SHA **`8b6fae84e15084883d94e2121a7ab8f6219b7845`** · checkout / mint live / upload / enchères / xOrus privé **off** · `mint_dry_run=true` · `mint_oidc_pull_enabled=true` (lecture) · PayBox `mode=prod` et `paybox_checkout_enabled=false` |
| `api.xartists.art` | **NXDOMAIN**. L'API publique reste Render. |
| Studio [/v1/ops/studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) | HTTP **503** · postgres · `table_ready=false` · `schema_ready=false` · raison SQL non publiée |
| xOrus [/v1/xorus/analysis](https://xartists-access-api.onrender.com/v1/xorus/analysis) | `paper_only` · **ABSTAIN** `thin_tape` · `generated_at=2026-11-22T05:33:03Z` · 6 signaux analysés / 120 · exécution, signature, mint, transfert **faux** |
| Hub Neon | HTTP 200 · sandbox · `execution_authorized=false` · `linked_wallets=0` · pas l'access-api |

Le site public sert `d5f1140e`. Le commerce ne l'est pas. L'API est en retard sur les Pages ; l'aligner est un redéploiement Render, pas une autorisation.

## Suite code (pas un gate)

[PR #626](https://github.com/Neltud/xArtists/pull/626) livre l'exposition HTML autonome (hash local, sans vente). Le check `ux-local` cherchait le titre `xOrus, l’intelligence expliquée simplement` et le bouton « Afficher les outils avancés ». Le correctif est ce titre, avec les outils avancés repliés et le swap assisté invisible par défaut. Aucun drapeau finance.

## Veille citée, non exécutée

* EGLD **2,26 $** (CoinGecko, +2,5 % / 24 h, cap. ~70,4 M$). TVL chaîne DefiLlama **~10,78 M$**. Le 16 nov la sonde interne citait 2,62 $ et 10,73 M$. Écart noté. xOrus s'abstient.
* Supernova mainnet : blocs **600 ms** depuis le 10 septembre 2026. Ce n'est pas un motif pour signer à la place de l'utilisateur.
* Reown AppKit universal connector **2.0.0** (vers le 16 nov 2026) ne prouve pas #506. Un bureau tactile Windows peut encore masquer le QR WalletConnect.

## Ordre inchangé

1. #506 allowlist + QR, sans achat.
2. Merger #626 une fois `ux-local` vert. Pas de checkout.
3. Backup + migrations Studio sur la base liée à l'API live.
4. Redéploiement Render, drapeaux inchangés.
5. #428 seulement après 1.
