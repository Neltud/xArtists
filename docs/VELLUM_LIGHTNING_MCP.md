# Vellum · Lightning MCP (optionnel)

## Pourquoi

LIA peut payer des APIs L402 / recevoir des micro-paiements **Bitcoin Lightning** via [lightning-wallet-mcp](https://lightningfaucet.com/build/), **en parallèle** du rail MultiversX (NFT, $TRO, board).

## Install hôte ops (pas le navigateur)

```bash
npx -y lightning-wallet-mcp
# ou
npm i -g lightning-wallet-mcp && lw register --name "LIA-xArtists"
```

MCP client config : voir `docs/LIGHTNING_AGENT_WALLET.md`.

## Flags

```text
LIGHTNING_AGENT_LIVE=0   # défaut
# =1 seulement après register + budget sats/jour + recovery hors git
```

## Isolation

- Wallet Lightning ≠ wallet EGLD LIA ops ≠ wallet utilisateur dApp
- Pas de clé dans le repo GitHub Pages

## Front

UI status : `/#/agents/lightning`
