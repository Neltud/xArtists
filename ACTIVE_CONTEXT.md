# ACTIVE_CONTEXT — xArtists / xOrus

## Passerelle plateformes — 21 novembre 2026 (16:34 UTC)

`xorushub` est déployé sur **Neon Free**, dans `xartists-access-sandbox` uniquement. Une seule organisation logique `xartists` ; aucun compte fournisseur ni wallet fusionné. Source runtime `825292a7ef2e397d98d9cfdf34065dc99f11ac72` ; [PR #625](https://github.com/Neltud/xArtists/pull/625).

- [Health HTTPS](https://br-steep-sun-bab7l93p-xorushub.compute.c-8.eu-central-1.aws.neon.tech/health) et registre `/v1/xorus/platforms` répondent 200. Cette fonction n'est pas `access-api`.
- Livraison native Neon prouvée à **16:34:00 UTC** ; reçu persistant à 16:34:01 UTC. Quatre endpoints **techniques** atteints : Bitcoin, Solana, Polymarket, Kraken. Aucun prix ou signal de marché collecté.
- Trigger `xorus-hub-hourly` actif, cron final `17 * * * *` UTC ; intervalle d'une minute utilisé uniquement pour vérifier la première livraison, puis rétabli à l'horaire final.
- Plans de compatibilité EVM / Solana / Bitcoin / MultiversX disponibles. **Zéro wallet lié**, signatures externes non implémentées ici, MetaWin manuel (API publique officielle d'automatisation non vérifiée).
- `ABSTAIN`, inférence IA non configurée, exécution / paris / transferts / signatures **non implémentés**. Une région serveur ne prouve pas l'éligibilité géographique de l'utilisateur.
- 15 tests ciblés verts ; six checks GitHub verts sur le commit source. Lectures opérateur authentifiées 200 ; appels sans authentification et faux trigger client 401 ; route de pari 503.

Preuve complète et limites : [`deploy/neon/xorus-hub/deployment-receipt-20261121.json`](deploy/neon/xorus-hub/deployment-receipt-20261121.json). Les observations Pages/API ci-dessous sont celles du 20 novembre, pas une nouvelle sonde du 21.

## Mesure publique — 20 novembre 2026 (~18:54 UTC)

Sonde lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · SHA servi **`9610b56`** · construit `2026-11-20T18:57:55Z` · `lia_live_trading=false` · 140 routes |
| API Render `/health` | HTTP 200 · SHA `8b6fae84` · `execution` non autorisée · checkout / mint live / upload / enchères **off** |
| `api.xartists.art` | **NXDOMAIN**. L'API publique reste Render. |
| DNS apex + MX | A GitHub Pages ; MX `mail.xartists.art` (DNS seulement, pas une preuve de boîte) |
| Studio store | HTTP **503** · postgres · schéma absent |
| Blocage Pages | levé. Run [44797583538](https://github.com/Neltud/xArtists/actions/runs/44797583538) vert. Le numéro de release reste 0.139.0 tant que la PR release-please n'est pas mergée. |

Détail : [`docs/ops/PROBE_PUBLIC_2026-11-20.md`](docs/ops/PROBE_PUBLIC_2026-11-20.md).

Le site public sert `9610b56`. Le commerce ne l'est pas.

---

## Mesure publique — 19 novembre 2026 (~12:25 UTC)


Sonde lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · `fdd072190d0af7e7dbb7386b301b14ac218c9373` · `built_at=2026-11-17T13:54:38Z` · 140 routes · `lia_live_trading=false` |
| Bundle live | appelle **uniquement** `https://xartists-access-api.onrender.com` (`api.xartists.art` absent du JS et du `connect-src`) |
| API Render `/health` | HTTP 200 · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` · `execution_authorized=false` · checkout / mint live / upload / enchères / xOrus privé **off** |
| `api.xartists.art` | **NXDOMAIN** (DoH Google). Pas un GO. |
| Studio store | HTTP **503** · postgres · tables absentes |
| xOrus signal du jour | `observe` · confidence 0.4 · `execution=disabled` · fallback paper |
| Smoke 6 h | était rouge **à cause du NXDOMAIN**, pas parce que le site ou Render étaient down. Le probe public suit maintenant l'origine réellement publiée. |

Détail : [`docs/ops/PROBE_PUBLIC_2026-11-19.md`](docs/ops/PROBE_PUBLIC_2026-11-19.md).

Le site public reste live. Le commerce ne l'est pas. Aligner le SHA Render sur `main` est un redéploiement Render, pas une autorisation.

---

## Mise à jour opératoire — 17 novembre 2026 (~14:00 UTC)

**LIA est retirée du chemin d'exécution.** Le backend paper canonique est le package top-level **`xorus/`**.

### Décision produit / tech

| Avant | Après |
|-------|--------|
| `python -m lia.vellum.production_run` | `python -m xorus.production_run` |
| `python -m lia.xorus` | `python -m xorus` |
| `LIA_LIVE_TRADING` | **interdit** (erreur si =1 dans `xorus.production_run`) |
| Intelligence | **xOrus only** — dual reports Grok + ChatGPT ≤15 %, Sentinel veto |

Plan détaillé : [`docs/ops/LIA_PURGE_XORUS_BACKEND.md`](docs/ops/LIA_PURGE_XORUS_BACKEND.md)  
Entrée : [`docs/XORUS_BACKEND_ENTRY.md`](docs/XORUS_BACKEND_ENTRY.md) · package [`xorus/`](xorus/)

### Hébergement (rappel contrôle 17 nov)

- Commit `a32870bc` : déploiement SSH OVH **désactivé** (*no VPS present*).
- Pas de redéploiement serveur tant qu'une cible nominative n'est pas certifiée (Neon readonly / autre).
- Pages live : vérifier [build-info.json](https://xartists.art/build-info.json) — `lia_live_trading` doit rester `false`.

### Garde-fous inchangés

Aucun paiement, mint, trading live, transfert, migration prod, wallet ou DNS activé par ces changements.

### Prochaines phases (purge)

1. Migrer modules `lia/xorus/*` → `xorus/` (imports hors `lia.chorus` quand possible).
2. Front : couper widgets LIA / `VITE_LIA_*` live ; XorusPage data-only xOrus.
3. Archiver `lia/vellum` + docs LIA ops.
4. `git mv lia archive/lia-retired` après zéro import actif.

---

## Archive — 16 novembre 2026 (05:33 UTC)

Voir historique git pour le probe Pages/API de ce jour. SHA et endpoints de l'époque sont périmés pour décision ; relire les endpoints frais.
