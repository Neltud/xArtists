# Product locks — Packs · GSN · Pricing · Capital multi-agent

## Prix = intensité de signaux

| Pack | Signaux | List € | Corridor € |
|------|---------|--------|------------|
| **Pulse** | ●●● max | **18** | 12–25 |
| **Yield** | ●● | **12** | 8–20 |
| **Sentinel** | ● | **8** | 5–15 |

LIA ajuste pour marge · DAO plus tard = BPS pool.

## GSN

Informational + signal only — **pas vendu**.

## Capital user → agent qui trade

| Phase | Comportement |
|-------|----------------|
| **v1** | Buy → Stake → Claim share. **Pas** de deposit trading (droit produit). |
| **v1.5+** | Deposit → **escrow pack** (pas wallet LIA ops). LIA **une décision** → routeur multi-capital → tickets par `agent_id` filtrés par pack. |
| **Interdit** | Envoyer des fonds directement à l’adresse LIA ops “pour mon agent”. |

Voir `docs/MULTI_AGENT_CAPITAL.md` + `lia/agents/multi_capital_router.py` (paper).

## UX

Buy → Stake → (Deposit escrow) → Claim
