# Moltbot ↔ MX-8004 ↔ xArtists LIA

**Date :** 23 septembre 2026  
Croisement fin entre [moltbot-starter-kit](https://github.com/sasurobert/moltbot-starter-kit) skills et le plan First 100 / Phase 4.

---

## Skills moltbot (Identity / Validation / Reputation)

| Skill file | Exports clés | Rôle MX-8004 | Usage xArtists |
|------------|--------------|--------------|----------------|
| `identity_skills.ts` | `registerAgent`, `getAgent`, `setMetadata` | Identity Registry (soulbound NFT + manifest URI) | LIA principal + packs comme offerings |
| `validation_skills.ts` | `initJob`, `submitProof`, `isJobVerified`, `getJobData` | Validation Registry (jobs prouvables) | 5 jobs First 100 (yield, risk, signal, rebalance, monitor) |
| `reputation_skills.ts` | `submitFeedback`, `getReputation` | Reputation Registry (trust score) | Trust > 90 après jobs validés |
| `escrow_skills.ts` | `deposit`, `release`, `refund` | Escrow / ACP | Hire flow x402 optionnel |
| `hiring.ts` / facilitator | hire + x402 | market.molt.bot “Hire” | Après registration |
| `discovery_skills.ts` | `discoverAgents` | Indexer / marketplace | Découverte LIA sur market.molt.bot |

Réf. identity : `register_agent(name, uri, public_key)` — URI pointe vers JSON `registration-v1`.

---

## Mapping LIA / sub-agents → offerings

| Agent | serviceId (manifest) | Job type Validation | Preuve typique |
|-------|----------------------|---------------------|----------------|
| **LIA** | 1 Yield / 3 Signal | Yield supply, portfolio signal | TX Hatom + DecisionProof hash |
| **Pulse** | (skill pack) | Market pulse job | Signal JSON + timestamp |
| **Yield** | 1 | Idle → Hatom | Supply receipt |
| **Sentinel** | 2 Risk | Risk halt / HF alert | Event + error_bus log |

Un seul **Identity** LIA avec plusieurs offerings est le chemin le plus simple pour First 100 ; packs peuvent rester off-chain / Stripe jusqu’à SC agents live.

---

## Séquence recommandée (après Mainnet Push)

1. Publier `data/mx8004_lia_manifest.json` (généré par `scripts/register_mx8004_lia.py`).
2. `registerAgent` via moltbot **ou** `python scripts/register_mx8004_lia.py` (live branch à brancher) avec `LIA_WALLET_PEM_PATH` Vellum.
3. Stocker `agent_nonce` / tx dans `data/mx8004_registration.json`.
4. Boucle jobs : `initJob` → exécution LIA paper/micro → `submitProof` → oracle / verify.
5. `submitFeedback` sur jobs OK → viser trust > 90.
6. Badge UI : passer “Not registered” → “MX-8004 #nonce” quand `data/mx8004_registration.json` live.

---

## Env (Vellum / ops)

```bash
export CHAIN=1
export IDENTITY_REGISTRY_ADDRESS=erd1...   # post Mainnet Push
export VALIDATION_REGISTRY_ADDRESS=erd1...
export REPUTATION_REGISTRY_ADDRESS=erd1...
export LIA_WALLET_PEM_PATH=/secure/path.pem   # NEVER in git
export LIA_MANIFEST_URI=https://raw.githubusercontent.com/Neltud/xArtists/main/data/mx8004_lia_manifest.json
export DRY_RUN=1   # défaut ; 0 seulement quand registries live + PEM OK
```

---

## Liens

- Starter kit : https://github.com/sasurobert/moltbot-starter-kit  
- OpenClaw skills : https://github.com/sasurobert/multiversx-openclaw-skills  
- Specs : https://github.com/multiversx/mx-agent-standard  
- Contracts : https://github.com/sasurobert/mx-8004  
- xArtists plan : [MX8004_FIRST100_ALIGNMENT.md](MX8004_FIRST100_ALIGNMENT.md)  
- Script : `scripts/register_mx8004_lia.py`

---
*xArtists · 23 sep 2026*
