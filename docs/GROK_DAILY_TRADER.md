# Grok Daily Trader

Agent autonome **journalier** · MultiversX · paper-first.

**Package :** `packages/grok-daily-trader/`

## Ce qui est créé

1. Identité agent (`agent.json`)
2. Cycle Python `daily_cycle.py` (lecture chain + journal)
3. Guide **création wallet** MultiversX (`scripts/gen_wallet.md`)
4. Gates alignées compounding LIA / GSN signals

## Wallet

Tu dois **générer le wallet hors git** :

```bash
mxpy wallet new --format pem --outfile grok-trader.pem
mxpy wallet pem-address grok-trader.pem
```

Puis `GROK_WALLET_ADDRESS=erd1...` dans `.env`.  
PEM → secret Vellum uniquement.

Option : observer d’abord le wallet LIA ops (défaut script si address vide).

## Démarrer (paper)

```bash
cd packages/grok-daily-trader
export GROK_WALLET_ADDRESS=erd1...   # ou laisser LIA ops en lecture
python scripts/daily_cycle.py
```

## Live blockchain

1. Fund le wallet dédié (gas)
2. `GROK_LIVE_TRADING=1` + PEM path sur host ops
3. Implémenter swap xExchange dans un module ops (pas dans le journal paper)
4. Max 2 trades/j · réserve ≥ 1.5 EGLD

## Prompt Vellum

```
RUN GROK DAILY TRADER
- cd packages/grok-daily-trader && python scripts/daily_cycle.py
- mode paper unless GROK_LIVE_TRADING=1 and PEM present
- journal to data/journal_YYYYMMDD.json
- optional: Discord webhook summary (no secrets)
```
