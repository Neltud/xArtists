# Vérité SC — LIA / GrokyversX / deploy

## Wallets (EOA — pas des SC)

| Wallet | Adresse | Rôle |
|--------|---------|------|
| **LIA ops** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | Board / ops / ~2 EGLD (probe) |
| **GrokyversX** | `erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl` | Host trader optionnel · 0 EGLD probe |

Ce ne sont **pas** des adresses de smart contracts. LIA n’a **pas** de SC « à elle » déjà déployés avec code.

## Adresses dans `contracts.json`

Les `erd1qqqq…` listées (marketplace, nft_staking, etc.) sont des **placeholders historiques**.

Live API (2026-09-25) : **`codeHash: null`**, balance 0 → **NOT_DEPLOYED**.

**Ne pas envoyer de fonds** vers ces adresses vides.

## Source SC dans le repo

| Contract | Code source | Déployé ? |
|----------|-------------|-----------|
| nft-marketplace | oui | non |
| agents-marketplace | oui | non |
| slot-casino | oui | non |
| nft-staking | oui | non |
| tro-staking | oui | non |
| agent-stake-escrow | oui | non |

## Qui déploie ?

- Workflow `.github/workflows/deploy-scs.yml`
- Secret **`LIA_WALLET_PEM`** uniquement (jamais git/chat)
- Mainnet : `confirm_mainnet=DEPLOY_MAINNET`
- Après deploy : verify codeHash → update `data/contracts.json` → flags front

## Interaction LIA une fois SC live

Oui : LIA/Vellum appellent les endpoints (`stake`, `stakeNft`, marketplace…) **via txs signées PEM Vellum/LIA**, après guardian 8008.

Tant que codeHash null → paper only.
