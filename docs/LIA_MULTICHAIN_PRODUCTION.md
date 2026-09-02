# LIA Multichain — Production build (MultiversX base)

## Principle

```
                    ┌─────────────────────────┐
                    │   xArtists dApp (Pages) │
                    │   React / PWA / agents  │
                    └───────────┬─────────────┘
                                │ data/* JSON
                    ┌───────────▼─────────────┐
                    │  Vellum Orchestrator    │
                    │  Timer → DataHub → ...  │
                    └───────────┬─────────────┘
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
    │ MVX BASE     │   │ SOL planned  │   │ HL / Soul future │
    │ xExchange    │   │ Jupiter      │   │ zk / restake     │
    │ Hatom OneDex │   │ signals only │   │ experimental     │
    │ SC market    │   │              │   │                  │
    │ LIA PEM      │   │              │   │                  │
    └──────────────┘   └──────────────┘   └──────────────────┘
```

**MultiversX is the only chain that holds user funds + LIA PEM execution today.**
Other chains = signals / future adapters — never mix risk budgets.

---

## Repo map (production-relevant)

| Area | Path | Role |
|------|------|------|
| dApp | `apps/frontend`, root `vite`/`src` | UI Pages |
| SC | `contracts/agents-marketplace`, `nft-marketplace` | Mainnet market |
| LIA core | `lia/circuit`, `lia/risk`, `lia/executor` | Trade + TP + guards |
| Venues | `lia/venues/*` | MVX / SOL / HL / Soul |
| Agents | `lia/agents/*` | GreenSmoke + **mvx_agent** |
| Vellum | `lia/vellum/*` | Live cycle + publish |
| Data mirror | `data/*` → `docs/data`, `public/data` | Frontend feed |
| Deploy | `scripts/deploy_mainnet.sh` | MAINNET only |

---

## dApp surface (expected routes)

| Route | Data | Notes |
|-------|------|-------|
| `/` | status, onchain | Home |
| `/trading` | trades, trailing | LIA cockpit |
| `/portfolio` | portfolio | Wallet LIA |
| `/hatom` | hatom_lia | Yield sleeve view |
| `/tro` | tro_pool | Policy no-hold |
| `/marketplace` | collections | NFT |
| `/agents` | agents_catalog, contracts | Limited AI agents + fee split |
| `/lp` | TRO/EGLD | OneDex external |

---

## Production build order (MVX)

1. **SC** — isolate build → simulate → deploy mainnet → `contracts.json`
2. **Blackbox** — list/buy/cancel/claimFees micro amounts
3. **Frontend env** — `VITE_*` addresses + fee_bps=300
4. **`npm run build`** + GH Pages
5. **Vellum** — PEM secret, `LIA_LIVE_TRADING=0` until gates green
6. **Reporter** every cycle → publish data
7. **Only then** enable live trading micro size

Solana / HL / Soul: **no production keys** until dedicated risk doc + executor adapter.

---

## AI Agent MultiversX

Module: `lia/agents/mvx_agent.py`

- Reads DataHub + GreenSmoke + venue signals
- Emits decision for Orchestrator
- May list limited agent packs on-chain (when SC live)
- Never leaves MVX for settlement

---

## Soul Protocol + zk

| Layer | Status |
|-------|--------|
| `lia/venues/soul.py` | yield/restake stubs |
| `lia/venues/soul_zk.py` | zk proof verify interface |
| On-chain verifier | not deployed |

zk flow (future):

```
claim / credit / restake
  → off-chain prover
  → proof bytes + public inputs
  → MVX verifier SC or Soul API
  → unlock size / yield gate
```

Until verifier address exists: all zk calls return `status=planned`.

---

## Gaps still open

| ID | Item |
|----|------|
| G3 | agents_marketplace address null until deploy |
| G5 | Frontend rebuild after every data/SC push |
| G6 | claimFees needs redeploy |
| Multichain | SOL/HL executable = false |
| Soul zk | prover + verifier not live |

---

## Commands

```bash
./scripts/production_checklist.sh
python -m lia.agents.mvx_agent
python -m lia.circuit.strategies_venues
```
