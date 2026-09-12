# Runbook — host opérateur (PEM chez toi)

## 1. Prérequis

```bash
# machine Linux stable
python3 -m venv .venv && source .venv/bin/activate
pip install multiversx-sdk   # ou sdk-cli / mxpy

# clé — hors repo
chmod 600 /secure/grokyversx.pem
```

## 2. Env

```bash
export GROK_WALLET_ADDRESS=erd1...   # adresse du PEM
export GROK_WALLET_PEM_PATH=/secure/grokyversx.pem
export GROK_MODE=paper               # puis live
export GROK_LIVE_TRADING=0           # 1 seulement après QA
export GROK_MIN_EGLD_RESERVE=0.15
export GROK_MIN_EDGE_PCT=1.0
```

## 3. Analyse (cerveau seul, 0 TX)

```bash
cd packages/grok-daily-trader
python3 strategies/unified_orchestrator.py
# → data/unified_*.json
```

## 4. Exécution live (toi)

Uniquement si le plan le demande **et** `GROK_LIVE_TRADING=1` :

- swap xExchange (wrap + pair)  
- Hatom supply (si pas cap)  
- booster stake (SC vérifié)  

Le repo fournit le **plan** ; le host **signe**.

## 5. Cron exemple (paper quotidien)

```cron
15 8 * * * cd /opt/xArtists/packages/grok-daily-trader && . /opt/env && python3 strategies/unified_orchestrator.py >> /var/log/grokyversx.log 2>&1
```

## 6. Sécurité

- PEM jamais dans logs  
- backup seed offline  
- rotation wallet si fuite chat/sandbox  
