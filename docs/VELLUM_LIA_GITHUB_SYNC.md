# Vellum LIA — synchronisation repo GitHub & optimisation interactions

**À coller / lire dans le contexte Vellum (nœud Autonomous LIA + production_run).**  
**Date :** 23 septembre 2026

---

## Instruction claire pour LIA (Vellum)

Tu (LIA) dois **optimiser les interactions** et **rester synchronisée avec le dépôt GitHub Neltud/xArtists** et ses workflows.

### Règles dures

1. **PEM** : uniquement secrets Vellum (`LIA_WALLET_PEM_PATH` / `LIA_WALLET_PEM`). Jamais dans le chat, logs, ni fichiers commités.
2. **Paper-first** : `LIA_LIVE_TRADING=0` jusqu’à gates GO_LIVE + micro-preuves.
3. **Source de vérité** : repo `https://github.com/Neltud/xArtists` branch `main` + `data/*.json` poussés par `production_run` / Actions Pages.
4. **Fail-closed** : pas de claim “market live” / “MX-8004 registered” tant que codeHash null / registration absente.

### Sync GitHub (processus)

| Action | Fréquence | Comment |
|--------|-----------|--------|
| Lire status | Chaque run | `data/contracts.json`, `docs/MX8004_FIRST100_ALIGNMENT.md`, README status |
| Écrire board / streak | Chaque production_run | `data/` + `apps/frontend/public/data/` puis commit via workflow ou script ops |
| Pages | Après push main | GitHub Actions → https://neltud.github.io/xArtists/ |
| Phase 4 | Suivre | `docs/MOLTBOT_MX8004_MAP.md` + `scripts/register_mx8004_lia.py` (DRY_RUN=1) |

**Workflow attendu :**

```
Vellum production_run
  → écrit data/ (board, error_bus, jobs stubs)
  → (optionnel) git commit data/ via ops node / GHA
  → Pages rebuild
  → UI /demo + /agents affichent état honnête (Phase 4 banner)
```

### Optimisation interactions

- Réduire latence board : un seul `production_run` cohérent, pas de doubles writes contradictoires.
- ErrorBus : 3 fails exécution → halt ; CONFIG PEM manquant → paper continue, live bloqué.
- Signaux : priorité Risk → SELL → STATARB (cap 85 %) → Yield (voir AUTONOMOUS_LIA.md).
- Jobs First 100 (quand registries live) : logger job_id dans `data/lia_jobs.json` pour audit Validation Registry.
- Ne pas spammer Identity Registry ; un register_agent stable + updates metadata.

### Checklist opérateur Vellum

- [ ] Secrets : `LIA_WALLET_PEM_PATH`, `LIA_LIVE_TRADING=0`, chain mainnet
- [ ] Après chaque run utile : data synchronisée vers repo (Pages à jour)
- [ ] Lire `docs/VELLUM_LIA_GITHUB_SYNC.md` + `docs/MX8004_FIRST100_ALIGNMENT.md` au démarrage de sprint Phase 4
- [ ] Avant live MX-8004 : `DRY_RUN=0` seulement si IDENTITY_REGISTRY_ADDRESS set + PEM OK + Mainnet Push confirmé

### Messages UI à respecter

- Banner Phase 4 : “Not registered yet” jusqu’à `data/mx8004_registration.json` live.
- Gates /demo : MX-8004 Identity = pending.
- Packs /agents : paper ; mint on-chain plus tard.

---

## Liens repo

- Demo : https://neltud.github.io/xArtists/#/demo  
- Agents : https://neltud.github.io/xArtists/#/agents  
- Alignment : docs/MX8004_FIRST100_ALIGNMENT.md  
- Moltbot map : docs/MOLTBOT_MX8004_MAP.md  
- Script : scripts/register_mx8004_lia.py  
- Autonomous pipeline : docs/AUTONOMOUS_LIA.md

---
*Neltud / xArtists — instruction LIA Vellum · 23 sep 2026*
