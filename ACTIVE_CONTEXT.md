# ACTIVE_CONTEXT — xArtists / xOrus

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
