# MX-8004 / First 100 Alignment — xArtists LIA & Sub-Agents

**Date :** 23 septembre 2026  
**Contexte :** Phase 4 MultiversX Agent Economy (market.molt.bot, Bounty Genesis, Mainnet Push)  
**Objectif :** Positionner LIA + sub-agents pour les critères **First 100** (1 EGLD bounty).

Source officielle Phase 4 : [economy_and_launch_specs.md](https://raw.githubusercontent.com/sasurobert/multiversx-agent-standard/master/economy_and_launch_specs.md) + [mx-agent-standard](https://github.com/multiversx/mx-agent-standard) / [mx-8004](https://github.com/sasurobert/mx-8004).

---

## Critères First 100 (rappel)

Pour recevoir **1 EGLD** :

1. **MX-8004 registration** — Identity Registry (soulbound NFT + manifest)
2. **≥ 5 verified jobs** — Validation Registry (preuves oracles)
3. **Trust score > 90** — Reputation Registry (feedback sur jobs validés)

Séquence officielle : **Beta Launch** (Testnet) → **Bounty Genesis** → **Mainnet Push** → **Hackathon / ClawHub**.

---

## Cartographie agents xArtists → MX-8004

| Agent xArtists | Rôle actuel | Candidat First 100 | Skills / offerings proposés |
|----------------|-------------|--------------------|-----------------------------|
| **LIA v6** | Orchestrateur DeFi (Hatom, swaps, risk, compound) | **Principal** | Portfolio management, yield optimization, risk veto, paper/live trading signals |
| **Pulse** (sub) | Signaux / momentum | Oui (skill pack) | Market pulse, entry signals |
| **Yield** (sub) | Idle capital → Hatom / stables | Oui | Yield sleeve, auto-supply |
| **Sentinel** (sub) | Risk / circuit breaker | Oui | HF monitoring, halt on risk |
| **Swarm Risk / Aggregator** | Consensus multi-voix | Support | Decision proof, multi-brain consensus |
| **PolyLIA** | Prediction markets | Optionnel | Polymarket-style signals |
| **GreenSmoke consumers** | Forecasts externes | Support | Macro / politics / tech feeds |

**Priorité :** enregistrer **LIA** comme agent principal (manifest riche), puis exposer Pulse / Yield / Sentinel comme **Skill Bundles** ou services distincts (ou offerings du même identity).

---

## Plan d’alignement concret (étapes)

### Étape 0 — Prérequis (déjà en place côté xArtists)

- [x] LIA Ops funded (~2.09 EGLD, 19 sep)
- [x] Agents marketplace SC prêt (Rust, fee 3 %, list/buy)
- [x] Paper mode stable (`LIA_LIVE_TRADING=0`)
- [x] Fail-closed UI (pas de faux “live market”)
- [ ] SC agents-marketplace + nft-marketplace **deployés + codeHash non-null**
- [ ] Treasury dest wallets renseignés

### Étape 1 — Identity Registry (MX-8004 registration)

1. **Suivre le Mainnet Push** (registries Identity / Validation / Reputation déployés).
2. Préparer un **manifest JSON** (schema `https://multiversx.com/standards/mx-8004#registration-v1`) :

```json
{
  "type": "https://multiversx.com/standards/mx-8004#registration-v1",
  "name": "LIA v6 — xArtists",
  "description": "Autonomous DeFi agent on MultiversX: yield optimization (Hatom), risk-managed compounding, multi-brain consensus (Pulse/Yield/Sentinel). Paper-first, verifiable jobs.",
  "image": "ipfs://... or https://neltud.github.io/xArtists/assets/lia-avatar.png",
  "version": "6.0.0",
  "active": true,
  "x402Support": true,
  "services": [
    {
      "name": "MCP",
      "endpoint": "https://... (ou relayer OpenClaw / MCP server)",
      "version": "2025-01-15",
      "offerings": [
        {
          "serviceId": 1,
          "name": "Yield Optimization",
          "description": "Idle capital → Hatom supply / farms with risk guards",
          "sla": 60,
          "requirements": { "type": "object", "properties": { "amount": { "type": "string" }, "token": { "type": "string" } } }
        },
        {
          "serviceId": 2,
          "name": "Risk Monitoring",
          "description": "HF / circuit-breaker alerts and halt signals",
          "sla": 5
        },
        {
          "serviceId": 3,
          "name": "Portfolio Signal",
          "description": "Paper or live trade recommendations with DecisionProof",
          "sla": 15
        }
      ]
    }
  ],
  "oasf": { /* skills + domains si disponible */ },
  "contact": { "twitter": "@tudurioriginal", "github": "https://github.com/Neltud/xArtists" }
}
```

3. Uploader le manifest (IPFS / Arweave / GitHub raw stable).
4. Appeler `register_agent(name, uri, public_key)` sur Identity Registry (via starter kit / mxpy / OpenClaw skill).
5. Stocker le **agent nonce / TokenID** dans `data/contracts.json` + UI Agents.

**Outils recommandés :**
- [moltbot-starter-kit](https://github.com/sasurobert/moltbot-starter-kit) / [mx-moltbot-starter-kit](https://github.com/multiversx/mx-moltbot-starter-kit)
- [multiversx-openclaw-skills](https://github.com/sasurobert/multiversx-openclaw-skills)
- Explorer agents : https://agents.multiversx.com

### Étape 2 — 5 jobs vérifiés (Validation Registry)

Chaque “job” = travail prouvable on-chain :

| Job type (proposition) | Preuve | Comment le produire avec LIA |
|------------------------|--------|------------------------------|
| Yield supply | TX Hatom supply + receipt | LIA Yield sleeve (déjà paper) → micro live |
| Risk alert | Event / hash decision + outcome | Sentinel / Swarm Risk halt log |
| Signal delivery | DecisionProof hash + timestamp | Brain + PerformanceReporter |
| Portfolio rebalance | Swap TX + PnL paper→live | Circuit +1% / STATARB |
| Monitoring report | Structured JSON + oracle validation | GreenSmoke + LIA reporter |

**Actions :**
- Implémenter `init_job` / `submit_proof` (Validation Registry) dans un skill LIA ou via moltbot.
- Faire 5 cycles **vérifiés** (oracle ou self-attestation selon le standard final) **avant** de viser le bounty.
- Logger les job_ids dans `data/lia_jobs.json` pour audit.

### Étape 3 — Trust score > 90 (Reputation)

- Feedback positif sur les 5+ jobs validés (submit_feedback).
- Éviter spam / self-rating abusif (le standard anti-gaming).
- Maintenir active=true + mises à jour manifest régulières.

### Étape 4 — Exposition marketplace (market.molt.bot + xArtists)

- Une fois Identity live → l’indexer MX-8004 doit découvrir LIA.
- xArtists Agents Marketplace (SC déjà prêt) peut lister “LIA-v6” / packs en parallèle (buyAgentAction).
- x402 support dans le manifest pour le flux “Hire” de market.molt.bot.

### Étape 5 — ClawHub / Skill Bundles (bonus)

Exposer :
- Cross-shard / multi-venue arb skill (Jupiter latency arb + MultiversX)
- Autonomous security / risk monitor (Sentinel)
- Yield optimizer skill

---

## Checklist opérationnelle (ordre recommandé)

1. [ ] Attendre / confirmer **Mainnet Push** (registries live) — suivre agents.multiversx.com + annonces.
2. [ ] Deploy SC xArtists (market + agents) si pas encore fait → `./scripts/runbook_deploy.sh` + verify codeHash.
3. [ ] Préparer manifest LIA + image + endpoints MCP/x402 (même paper).
4. [ ] Register_agent (Identity) avec wallet LIA Ops.
5. [ ] Produire 5 jobs vérifiés (Validation) — paper d’abord, micro live ensuite.
6. [ ] Accumuler feedback → trust > 90.
7. [ ] Claim bounty First 100 si éligible.
8. [ ] Mettre à jour UI `/agents` + `/demo` avec badge “MX-8004 registered” + lien Explorer.

---

## Risques & garde-fous xArtists

- **PEM jamais dans git / chat** — LIA Ops uniquement en coffre local / Vellum secret.
- Rester **paper-first** jusqu’à 5 jobs stables + codeHash live.
- Ne pas promettre “live market” tant que SC codeHash null.
- Hardfork recovery v2.1.3.0 (23 Sep) : valider que les nodes / API sont stables avant TX registration.

---

## Références rapides

- Specs Phase 4 : https://github.com/multiversx/mx-agent-standard (Economy and Launch Specs)
- MX-8004 contracts : https://github.com/sasurobert/mx-8004
- Moltbot starter : https://github.com/sasurobert/moltbot-starter-kit
- OpenClaw skills : https://github.com/sasurobert/multiversx-openclaw-skills
- Agent Explorer : https://agents.multiversx.com
- xArtists demo : https://neltud.github.io/xArtists/#/demo
- xArtists go-live : https://neltud.github.io/xArtists/#/go-live

---

*Neltud / xArtists — alignment First 100 · 23 septembre 2026*
