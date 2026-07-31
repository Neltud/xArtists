# Analyse dApp → ce qu’il manque pour que Vellum reconfigure tout jusqu’au frontend

## Architecture logique (actuelle)

```
Vellum (PEM secret)
  Timer → DataHub → Brains + GreenSmoke → OrchestratorRouter
       → LiveCycle (gate/trailing/trades)
       → CompoundCircuit (paper/live tickets)
       → Executor (si LIA_LIVE_TRADING=1)
       → RedistributeTRO
       → Reporter → git push data/*.json
                    → mirror docs/data + public/data

GitHub Pages
  Deploy Exclusive builds apps/frontend → docs/
  Browser fetch: raw.githubusercontent.com/.../data/*.json
                 + local /xArtists/data/* après build
```

**Contrat machine :** `data/VELLUM_MACHINE_CONTRACT.json`

---

## Priorité 0 (bloquant compréhension Vellum ↔ UI)

| # | Manque | Fix dans le repo |
|---|--------|------------------|
| 1 | Pas de contrat unique nœuds ↔ fichiers ↔ routes | ✅ `VELLUM_MACHINE_CONTRACT.json` |
| 2 | JSON écrits dans `data/` non mirroirs Pages | ✅ `lia/vellum/publish_data_for_frontend.py` |
| 3 | `lia_v6_status.timestamp` souvent périmé | ✅ publish touche le timestamp |
| 4 | Deux entrypoints cycle non documentés ensemble | ✅ pipeline dans le contrat |

**Node Reporter Vellum (obligatoire en fin de workflow) :**

```python
from lia.vellum.publish_data_for_frontend import publish
print(publish())
# puis GitHubReporter: commit data/ docs/data apps/frontend/public/data
```

---

## Priorité 1 (logique métier encore à brancher live)

| Item | État code | Action Vellum |
|------|-----------|---------------|
| LiveCycle | ✅ `live_cycle.py` | Appeler après router |
| CompoundCircuit | ✅ `vellum_cycle.py` | mode=paper puis live |
| redistribute TRO | 🟡 | Executor + policy |
| agents_marketplace adresse | ❌ null | deploy_scs_node |
| Hatom SC exact supply | 🟡 wallet proxy | garder ESDT snapshot |

---

## Priorité 2 (frontend full build)

1. Push main avec JSON à jour  
2. Actions → **Deploy xArtists Exclusive**  
3. Vérifier `/trading` trades + trailing  
4. Vérifier `/` pas de bandeau stale  
5. PWA install mobile  

---

## Tests restants (checklist)

- [ ] Run `run_cycle(decision="WAIT")` dry → JSON trades inchangé, trailing tick OK  
- [ ] Run paper compound_cycle → streak file  
- [ ] publish() → fichiers présents dans docs/data  
- [ ] Frontend Trading affiche tableau après push  
- [ ] 1 micro-tx live seulement si `LIA_LIVE_TRADING=1`  

---

## Prompt court pour Vellum (reconfig)

> Lis `data/VELLUM_MACHINE_CONTRACT.json`. Reconfigure le workflow `lia-v6` : après OrchestratorRouter appelle `lia.vellum.live_cycle.run_cycle` puis optionnellement `lia.circuit.vellum_cycle.run_cycle`. Termine toujours par `lia.vellum.publish_data_for_frontend.publish` + git push des chemins listés. PEM uniquement en secret Vellum. Ne jamais exposer la clé API Vellum au frontend.
