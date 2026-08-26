# Project status — 2026-08-26 (soir)

| Capacité | Prêt ? |
|----------|--------|
| Dashboard / parcours 4 étapes / onboarding | Oui |
| Trading paper + compounding 10 col + annual UI | Oui |
| Brain cycle UI (EV · Meta · DecisionProof paper) | Oui |
| Signaux GSN≥80% · Polymarket · free · fusion · ticker | Oui (advisory) |
| Pretrade + attach_proof + paper_with_proof executor | Oui (soft) |
| DecisionProof module (`lia/intent`) | Oui — commitment, pas SNARK |
| Commander UI | Oui |
| Pin IPFS (Pinata) | Oui (JWT secret ops) |
| List / Buy / Bid NFT on-chain | **Non** — codeHash null |
| Buy agent on-chain | **Non** — agents_marketplace null |
| LIA live trading | **Non** — LIA_LIVE_TRADING=0 |
| Capital escrow Fund UI | Spec + Soon |
| Treasury splitter live | Non — Mission/Reserve pending |

Gates: `allow_live_trading=false`.  
Operator: `python -m lia.vellum.production_run` (inclut `brain_cycle`).  
Gaps: `docs/GAP_REVIEW_FULL_2026-08-25.md`.
