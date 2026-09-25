# Vellum → MX-8008 intents

## Rôles

| Acteur | Rôle |
|--------|------|
| **MX-8004** | Identité / First 100 registration |
| **MX-8008** | Execution Sentinel — guardian + journal |
| **Vellum** | Seul signataire ops (**PEM Vellum / LIA_WALLET_PEM** secret) |
| **Grok** | Propose intents — ne signe pas |

## Flux

```
propose_leg (Grok/LIA board)
    → guardian_check (8008)
    → if paper: journal_settle only
    → if live + allowed: execute_leg (Vellum PEM)
    → journal_settle
```

## SC calls

`sc_call` seulement si `data/contracts.json` a une adresse avec **codeHash non null** (vérifié live API).

Aujourd’hui (2026-09-25) : **aucun SC produit déployé** (comptes vides).

## Deploy micro-EGLD

1. Secret GitHub `LIA_WALLET_PEM` (LIA a ~2 EGLD)
2. Actions → **Deploy Smart Contracts**
3. chain=`D` d’abord (devnet) OU mainnet + `confirm_mainnet=DEPLOY_MAINNET`
4. contract = `nft-staking` | `tro-staking` | marketplaces
5. Vérifier codeHash → remplir `contracts.json` → **puis seulement** `VITE_*_CODEHASH_OK`

## GrokyversX

Adresse publique host trader — **0 EGLD** au dernier probe. Ne pas utiliser comme deployer sans fonds + PEM ops séparé. PEM jamais dans le chat.
