# VELLUM × LIA — Handoff exhaustif (2026-10-07)

**Destinataire :** orchestrateur Vellum (brain)  
**Repo :** `Neltud/xArtists` · Pages : `https://neltud.github.io/xArtists/`  
**Auteur front/ops :** Grok (builder) + Neltud  
**Objectif :** intégrer, implémenter et **publier** LIA en live en tenant compte de **toutes les nouveautés front / API / produit** postérieures à la dernière mise à jour Vellum (réf. README_LIA ~2026-10-04).

---

## 0. Prompt système à coller dans Vellum

```text
Tu es l’orchestrateur LIA (brain) du monorepo Neltud/xArtists sur MultiversX mainnet.

MISSION
1. Exécuter le cycle paper (défaut) ou micro-live uniquement si LIA_LIVE_TRADING=1 ET gates verts.
2. Publier les JSON consommés par le front Pages (lia_hub_status, shadow, intents, signals, vellum_last_run).
3. Ne jamais promettre de rendement ; jamais de PEM/mnemonic dans git ou logs.
4. Aligner tes sorties sur le contrat front ci-dessous (nouveautés 2026-10-07).

CONTRAINTES DURES
- Chain = mainnet MultiversX uniquement.
- LIA_LIVE_TRADING défaut = 0 (paper).
- Capital Beta plafonné ; kill-switch si erreur critique d’accounting / calldata.
- Le wallet protocole LIA ≠ wallet user (user signe via xPortal ; agent a son propre path ops).
- Front = GitHub Pages hash-router (#/lia, #/command-center, …).

NOUVEAUTÉS FRONT (ignorées avant 2026-10-07) — TU DOIS LES CONNAÎTRE
A. Accueil = HomeMenuHall 3D (monument) : menu = 8 œuvres-portes (Musée, Marché, Slot, Packs, Command, TCA, LIA, Staking). Pas une landing 2D.
B. Command Center : nœuds 3D = MOMENTUM / FLOW / PULSE (plus Stake/Market). Mur holo + bars prix EGLD. Crash fixé : createPulseAtmosphereMesh() → {mesh,uniforms,dispose}.
C. SIWX (Ed25519) access-api : REQUIRE_SIWX défaut ON ; unsigned → SAMPLE. Challenge POST /v1/access/challenge ; verify POST /v1/verify-access.
D. Oracle signaux journaliers : DailySignalWidget + data/signals/daily_signal.json + GET /v1/signals/daily. Paper only.
E. Prix : GET /v1/prices (cache TTL 60s EGLD+TRO) — front livePrices / CommandWall.
F. TCA SAMPLE : plus de YouTube ; EphemeralStage canvas + RAG volatile POST /v1/rag/query (da_vinci_sfumato.json).
G. Audio zones : Mars=accueil, Elixir=command/LIA, Persic=musée/TCA. Bouton Musique ; fallback drone WebAudio si MP3 absents.
H. Musée : cadres verts = places d’exposition disponibles ; clic œuvre → approche lente avatar.
I. Plan du site : liens React Router cliquables.
J. i18n : fr,en,es,ru,uk,zh,ar (Header).

SORTIES JSON OBLIGATOIRES (mirror → apps/frontend/public/data/)
- lia_hub_status.json     (PnL shadow, strategy, confidence, paper flag)
- lia_shadow_export.json  (equity series)
- lia_shadow_sprint.json  (ticks STVP)
- lia_intent_feed.json    (intents paper, jamais « profit garanti »)
- lia_status.json / lia_live_status.json
- lia_paper_legs.json
- signal fusion / daily_signal (aligné oracle)
- vellum_last_run.json    (ts, ok, errors[], git_sha)

SCHÉMA MINIMA lia_hub_status.json
{
  "ts": ISO8601,
  "paper": true,
  "LIA_LIVE_TRADING": 0,
  "shadow_pnl_usd": number|null,
  "shadow_equity_usd": number|null,
  "win_rate": number|null,
  "fills": number,
  "strategy": string|null,
  "confidence": number|null,
  "note": string,
  "source": { "vellum_last_run": bool, "lia_paper_legs": bool }
}

PIPELINE
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m scripts.vellum_healthcheck
python -m lia.vellum.next_run
python -m lia.vellum.publish_data_for_frontend
# commit+push data/ et public/data/ si le job Vellum a droit write

LIVE (seulement après micro-preuve explorer documentée)
- Allowlist 2–3 tokens, plafonds dust
- UniversalExecutor : ce qu’il sait signer (swap / ESDTTransfer)
- 1 TX agent dust prouvée explorer avant scale

FRONT CONSUMERS
- /#/lia · LiaPage + panels shadow / intent / matrix
- /#/command-center · LiaShadowPanel + DailySignalWidget + CommandWall
- Aura agent : bull/bear/reward/stable (paper jusqu’à SC stake NFT)

INTERDIT
- Committer REQUIRE_SIWX=1 secrets dans le front bundle
- Afficher ownership local comme achat on-chain
- Auto-trade multi-ESDT sans allowlist + plafonds
```

---

## 1. État produit (honnête — 2026-10-07)

| Couche | État |
|--------|------|
| **SC mainnet** | tro_staking, marketplace, venue, slot, treasury (voir contracts.json) — badges LIVE seulement après TX explorer |
| **LIA trading** | **Paper** par défaut (`LIA_LIVE_TRADING=0`) |
| **Shadow** | JSON + panels CC ; KPI peuvent être figés tant que cron Vellum ne publie pas |
| **Signaux** | Daily signal paper + fusion panels |
| **Front** | Monument home, CC signals, SIWX, audio zones, TCA sans YouTube, musée slots verts |
| **Branches non mergées** | `fix/sprint-monument-audio-cc`, `feat/gallery-audio-ambience`, `feat/sprint-consolidation-prod`, … — **merger avant de considérer le front « à jour »** |

---

## 2. Architecture cible (inchangée, précisée)

```text
Vellum (secrets, cadence, allowlist)
    │  git pull · PYTHONPATH=.
    ▼
lia.vellum.next_run / production_run
    │  strategies · shadow tick · intents paper
    ▼
data/*.json  ──publish──►  apps/frontend/public/data/
    │
    ▼
GitHub Pages  neltud.github.io/xArtists/#/lia
              neltud.github.io/xArtists/#/command-center
```

**access-api** (si déployé) : challenge SIWX, verify-access, `/v1/signals/daily`, `/v1/prices`, `/v1/rag/query`.

---

## 3. Contrats de données (front)

### 3.1 Fichiers lus par le hub LIA / CC

| Fichier public/data | Usage UI |
|---------------------|----------|
| `lia_hub_status.json` | Hub strip, PnL shadow, strategy |
| `lia_shadow_export.json` | Courbe equity |
| `lia_shadow_sprint.json` | Sprint ticks |
| `lia_intent_feed.json` | Feed intents paper |
| `lia_paper_legs.json` | Legs paper |
| `lia_status.json` | Status générique |
| `signals/daily_signal.json` | DailySignalWidget |
| `lia_signal_fusion.json` | Fusion panel |
| `vellum_last_run.json` | Santé orchestrateur |

### 3.2 Intent JSON (paper)

```json
{
  "id": "uuid",
  "ts": "ISO8601",
  "side": "buy|sell|hold",
  "symbol": "EGLD|TRO|USDC|…",
  "size_usd": 0,
  "confidence": 0.0,
  "strategy": "name",
  "paper": true,
  "note": "court, sans promesse de profit"
}
```

### 3.3 Signaux daily

Alignés sur `xartists_daily_signal/v1` : headline, bias, disclaimer « pas un conseil financier ».

---

## 4. Cadence Vellum recommandée

| Job | Cadence | Action |
|-----|---------|--------|
| Shadow tick + publish hub | 4–6× / jour | `next_run` + `publish_data_for_frontend` |
| Daily signal | 1× / jour (cron GH existant) | `generate_daily_signal` / workflow |
| Healthcheck | chaque run | `scripts.vellum_healthcheck` |
| Live dust (optionnel) | manuel | 1 TX explorer documentée |

---

## 5. Gates avant LIA_LIVE_TRADING=1

1. `vellum_healthcheck` vert  
2. `lia_hub_status` mis à jour &lt; 24h  
3. Shadow export non vide  
4. Allowlist tokens + plafond USD  
5. **1 micro-TX agent** prouvée sur explorer  
6. Kill-switch ops documenté  
7. Front mergé (monument + CC fix) déployé Pages  

---

## 6. Routes front que LIA « voit » (expérience holder)

| Route | Rôle |
|-------|------|
| `#/` | Monument 3D — porte LIA |
| `#/lia` | Hub agent, shadow, intents |
| `#/command-center` | Glass cockpit, signaux, shadow panel |
| `#/trading` | Zone trading UI |
| `#/marketplace` | Listings NFT |
| `#/staking` | $TRO |
| `#/museum` | Galerie 3D (Persic audio) |
| `#/tca` | Classroom / SAMPLE EphemeralStage |

---

## 7. Secrets (Vellum / serveur uniquement)

- `LIA_LIVE_TRADING`  
- PEM / wallet agent (hors git)  
- `JWT_SECRET`, allowlist Pulse (access-api)  
- Pinata optionnel (`.env.vellum.example`)  
- **Ne jamais** mettre `VITE_*_CODEHASH_OK=1` dans le repo  

---

## 8. Checklist publication live (Vellum)

- [ ] `git pull` main (après merge des PR front)  
- [ ] Healthcheck OK  
- [ ] `next_run` paper → JSON non vides  
- [ ] `publish_data_for_frontend`  
- [ ] Commit/push `public/data/*`  
- [ ] Vérifier `#/lia` et `#/command-center` après deploy Pages  
- [ ] Bouton Musique / zone command = Elixir (quand MP3 présents)  
- [ ] Aucun claim de rendement dans les toasts intents  

---

## 9. Branches front à fusionner (contexte Grok)

| Branche | Contenu |
|---------|---------|
| `fix/sprint-monument-audio-cc` | CC z-crash, monument, audio, sitemap, musée slots |
| `feat/gallery-audio-ambience` | Zones audio HTML5 |
| `feat/sprint-consolidation-prod` | SIWX strict, prices cache, RAG |
| `feat/home-hall-no-youtube` | TCA sans YouTube |

Sans ces merges, Vellum publie des JSON sur un front partiellement ancien.

---

## 10. Message court pour le run Vellum

> Publish paper hub status + shadow export + intent feed. Keep LIA_LIVE_TRADING=0. Mirror to apps/frontend/public/data/. Align daily_signal disclaimer. No financial promises. After front PR merge, holders see LIA door in 3D monument and CC momentum/flow nodes.

---

*Document généré pour synchroniser Vellum avec l’état produit post-sprint 2026-10-07.*
