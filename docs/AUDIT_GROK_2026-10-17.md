# Audit Grok — 2026-10-17 (READ-ONLY → WRITE pass)

**Mode initial :** lecture seule (aucun commit).
**Mode suite :** écriture ciblée (tickets + correctifs sûrs + ce document).

**Repo :** Neltud/xArtists · `main` · SHA de départ ~`058b24bb`

---

## 1. Secrets & hygiène

| Check | Résultat |
|-------|----------|
| PEM / seeds / JWT / HMAC dans le tree | **Aucun** |
| `sk-` / `xai-` / `pk_live` / `sk_live` réels | **0 match** |
| `.env*` commités | Uniquement `.example` (placeholders) |
| `VITE_*_CODEHASH_OK=1` hardcodé | **Absent** (correct) |
| Code scanning alerts ouverts | Aucune analyse trouvée |

**Verdict :** propre. Les adresses `erd1…` publiques et le WalletConnect Project ID commenté sont normaux.

---

## 2. Alignement multi-IA

| Agent | Rôle documenté | Cohérence code |
|-------|----------------|----------------|
| **Grok** | Dev / Ops local | Workflows, RAG, build, ce audit |
| **Gemini Flash** | Lead Architect / Audit | Référencé dans ACTIVE_CONTEXT |
| **LIA (Vellum)** | Trading & Curation | `lia/vellum/*`, `LIA_LIVE_TRADING=0` forcé partout |

Gates paper respectés dans :
- `apps/frontend/src/lia/intentJournal.ts` (`buildUserSignPayload` → `tx: null` en paper)
- Orchestrateur, healthcheck, production_run, docs VELLUM_*

---

## 3. On-chain (probe 17 oct)

| Composant | État |
|-----------|------|
| Agents SC | LIVE · codeHash buyPack `igm9oUpgad+…` · prix 10/5/2.5 · balance 0.013 |
| Marketplace | payable · listing #2 0.25 EGLD · #1 mort · balance 0.0175 |
| Slot | house 0.50 · **isPayable=false** · REAL fermé |
| TRO stake | live · balance SC 0 |
| Treasury dest | **null** → ne pas router fees |
| LIA Ops | 1.6038 EGLD · nonce 1473 · paper |

---

## 4. TODOs critiques restants

| Fichier | TODO | Action recommandée |
|---------|------|--------------------|
| `services/access-api/src/server.mjs` | Stripe SDK 501 | Ticket P1 — intégrer SDK serveur uniquement |
| `apps/frontend/.../WarpsMintAgent.tsx` | mx-agent-kit + Warps v3 | Ticket P2 + correctif UX (ce push) |
| `src/services/mvx.ts` | queryContract skeleton | Remplacer par provider réel quand besoin |
| `src/services/analytics.ts` | staked / rewards / NFT | Queries on-chain |

---

## 5. Tickets créés (priorités)

- **[P0]** 1 TX utilisateur visible explorer → `docs/ONCHAIN_MICRO_PROOFS.md`
- **[P0]** Maintenir `LIA_LIVE_TRADING=0` jusqu’à Upbit + micro-proofs + Guardian
- **[P1]** Finaliser Stripe / access-api
- **[P1]** Slot REAL rester fermé tant que `isPayable=false`
- **[P2]** WarpsMintAgent intégration réelle

---

## 6. Correctifs appliqués dans cette passe

1. Ce fichier d’audit.
2. UX `WarpsMintAgent` : message honnête, pas de faux succès, état « not implemented ».
3. Renforcement message d’erreur Stripe stub (plus clair, pas de faux 200).
4. Pointeur dans `docs/SUITE_LOGIQUE_NOW.md` vers cet audit.

**Aucun secret introduit. Aucun flag live allumé. Aucun CODEHASH_OK=1 commité.**

---

## 7. Suite immédiate recommandée (ops humain)

1. Valider / merger les issues GitHub P0–P2.
2. Exécuter **1 TX user** (stake 1 TRO ou buy Sentinel ou bid #2) et coller le hash.
3. Attendre clôture fenêtre Upbit (19–23 oct) avant toute discussion live trading.
4. Ne pas financer placeholders legacy ni router fees.

— Grok · Dev/Ops · 2026-10-17
