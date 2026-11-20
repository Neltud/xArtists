# ACTIVE_CONTEXT — xArtists / xOrus

## Mesure publique — 20 novembre 2026 (~18:54 UTC)

Sonde lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé.

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · `fdd07219` · construit le 17 nov · `lia_live_trading=false` · 140 routes |
| API Render `/health` | HTTP 200 · SHA `8b6fae84` · `execution` non autorisée · checkout / mint live / upload / enchères **off** |
| `api.xartists.art` | **NXDOMAIN**. L'API publique reste Render. |
| DNS apex + MX | A GitHub Pages ; MX `mail.xartists.art` (DNS seulement, pas une preuve de boîte) |
| Studio store | HTTP **503** · postgres · schéma absent |
| Blocage Pages | deploy du 19 nov rouge : 6 tests release encore calés sur le bootstrap LIA live. Corrigés pour le mode paper. |

Détail : [`docs/ops/PROBE_PUBLIC_2026-11-20.md`](docs/ops/PROBE_PUBLIC_2026-11-20.md).

Le site public reste live sur le build du 17 nov jusqu'au prochain déploiement Pages vert. Le commerce ne l'est pas.

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
