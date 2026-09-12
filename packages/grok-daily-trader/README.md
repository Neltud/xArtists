# Grok Daily Trader — agent autonome journalier

Agent de trading **quotidien** pour xArtists / LIA sur **MultiversX mainnet**.

| Mode | Comportement |
|------|----------------|
| **paper** (défaut) | Scan balances, signaux, journal, **aucune TX** |
| **live** | Micro-swaps seulement si `GROK_LIVE_TRADING=1` + réserve EGLD OK |

**Ne jamais** committer PEM / seed. Wallet dédié ≠ wallet user dApp.

## Composants

```
packages/grok-daily-trader/
├── README.md
├── agent.json              # identité agent
├── .env.example
├── scripts/
│   ├── gen_wallet.md       # créer wallet MultiversX (hors git)
│   └── daily_cycle.py      # cycle journalier paper / live gated
└── data/                   # journals locaux (gitignored patterns)
```

## Quick start (paper)

```bash
cd packages/grok-daily-trader
cp .env.example .env
# renseigner GROK_WALLET_ADDRESS (lecture API) — pas de PEM en paper
python scripts/daily_cycle.py
```

Cron (paper quotidien ~18:00 UTC) :

```cron
0 18 * * * cd /path/to/xArtists/packages/grok-daily-trader && python scripts/daily_cycle.py >> logs/daily.log 2>&1
```

## Wallet MultiversX

Voir `scripts/gen_wallet.md` — génération **locale** (mxpy / xPortal), adresse publique dans `.env`, PEM uniquement secret Vellum/ops.

## Stratégies

Aligne `docs/LIA_COMPOUNDING_STRATEGIES.md` :

- S1 préservation · réserve ≥ 1.50 EGLD  
- S2 signaux (GSN / board) · WAIT → idle  
- S3 TRO DCA lent  
- Universe : EGLD, TRO-94c925, ASH — dust/NFT exclus  

## Grok / Vellum

L’agent peut être piloté par un run Vellum :

```
RUN GROK DAILY TRADER paper
- packages/grok-daily-trader/scripts/daily_cycle.py
- publish board summary
- GROK_LIVE_TRADING=0
```
