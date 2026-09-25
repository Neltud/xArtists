# Vellum × LIA — exécution des trades

## Principe

| Rôle | Responsabilité |
|------|----------------|
| **Grok / GrokyversX** | Analyse, propositions, board paper, intents |
| **Vellum** | Workflows, orchestration, **signature** avec **PEM Vellum** |
| **Guardian** | Caps, pause, allowlist, fail-closed |
| **User wallet** | Tips, slot, marketplace (xPortal) — jamais PEM protocole |

**Tous les trades ops LIA** (compounding, rebalance, legs autorisées) sont exécutés **dans Vellum** avec le **PEM Vellum** (stockage secret ops — pas git, pas chat, pas variables front).

## Flux

```
Signal / CrossScore
    → Grok propose (intent JSON)
    → Vellum node valide Guardian
    → Si OK: signe TX avec PEM Vellum
    → Broadcast mainnet (seulement si flags GO_LIVE)
    → Journal + board front (lecture)
```

## PEM policy

- PEM Vellum ≠ PEM user ≠ PEM LIA display address
- Rotation et backup hors repo
- CI deploy-scs : `confirm_mainnet=DEPLOY_MAINNET` obligatoire
- Front : `VITE_*_CODEHASH_OK` seulement après verify

## Agents (Pulse / Yield / Sentinel)

- Packs paper aujourd’hui
- Performance & sizing : page `/lia`
- Achat on-chain agents-marketplace quand `AGENTS_LIVE`

## Slot SC

- Provably fair lock/resolve
- Deploy séparé + seed progressive
- Front paper jusqu’adresse + codeHash

## Ne pas

- Mettre un PEM dans Vellum “prompt” ou GitHub Actions secrets partagés large
- Traiter le holder paper comme autorisation on-chain
- Activer SC flags avant blackbox micro-EGLD
