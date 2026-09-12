# Créer un wallet MultiversX dédié (Grok Daily Trader)

**Fais-le sur une machine ops sécurisée** — pas dans le repo git, pas dans le chat public.

## Option A — mxpy (recommandé ops)

```bash
# Install mxpy si besoin: pip install multiversx-sdk-cli
mxpy wallet new --format pem --outfile grok-trader.pem
# Affiche l'adresse publique — la noter dans .env comme GROK_WALLET_ADDRESS
mxpy wallet pem-address grok-trader.pem
```

- Copier **uniquement l’adresse** `erd1…` dans `packages/grok-daily-trader/.env`
- Stocker `grok-trader.pem` dans le secret store Vellum / SOPS / vault
- **chmod 600** le PEM · backup chiffré offline

## Option B — xPortal / Web Wallet

1. Créer un wallet neuf (pas le wallet perso collection)
2. Exporter / noter l’adresse publique
3. Pour live automation, dériver PEM via process ops documenté MultiversX (éviter seed en clair)

## Funding

1. Envoyer **uniquement** le gas nécessaire (ex. 0.5–2 EGLD) depuis LIA ops ou trésorerie
2. Garder **LIA ops** et **Grok trader** comme **deux adresses séparées** (recommandé)
3. Si un seul wallet ops pour commencer : même adresse LIA, mais `GROK_LIVE_TRADING` reste 0 jusqu’à QA

## Enregistrement public (optionnel)

Ajouter dans `data/contracts.json` → `wallets.grok_daily_trader` = adresse publique seulement.

## Interdit

- Commit `*.pem` / seed phrase
- Coller la seed dans Discord / X / GitHub issue
- Utiliser le wallet user Connect de la dApp comme bot
