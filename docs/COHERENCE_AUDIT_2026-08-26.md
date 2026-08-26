# Audit de cohérence dApp — 2026-08-26

## Chaîne décisionnelle (paper)

```
Oracle/Board → Agent/Desk → Mode → Guardian
    → Signals fusion (GSN≥80%) → Pretrade gate
    → Brain EV / Meta → DecisionProof (PaperOnly)
    → Paper leg log → Mirror → UI Trading
```

Cohérence **OK** si chaque étape soft-fail et n’ouvre pas de TX user.

## Séparation des rôles

| Acteur | OK ? |
|--------|------|
| User Connect ≠ LIA ops wallet | Oui (front + gates) |
| LIA paper ≠ user funds | Oui |
| List/Buy gated by codeHash | Oui (SC null) |
| PEM hors git | Oui (gate no_pem) |

## Modules brain joints (intégrés)

| Concept joint | Repo |
|---------------|------|
| DecisionProof / Verifier | `lia/intent/decision_proof.py` + types_reference.rs |
| Probabilistic EV | `lia/brain/probabilistic.py` |
| AutoTuner / Conquest / Portfolio / Economy / Evolutionary / Meta | `lia/brain/*` |
| Executor + proof | `lia/executor/paper_with_proof.py` |

## Incohérences restantes (acceptées ou P0)

1. **ZK-SNARK** nommé dans le design mais implémenté en **commitment hash** — documenté, pas trompeur en UI (`PaperOnly`).
2. **Deux cerveaux** (`pipeline` + `autonomous_lia`) — `production_run` est le cadence master recommandé.
3. **SC marketplace / agents** non déployés — bloquant produit on-chain.
4. **Mission/Reserve wallets** null — treasury splitter non live.
5. **Polymarket / GSN** peuvent être seed offline — fail-soft.

## Front profondeur

Pages principales: Dashboard parcours, Trading (brain+fusion+legs+compound), Agents, My Packs, Wallet, Portfolio, Marketplace (gated), Studio, Staking, TRO, DAO, Tip, Gallery.

UX honesty: onboarding, PageGuide, LiaVsUserBanner, SC banners, paper badges.

## Verdict

Corps **cohérent en paper** pour Vellum. Live / mint / buy agents **volontairement bloqués** jusqu’à codeHash + preuves.
