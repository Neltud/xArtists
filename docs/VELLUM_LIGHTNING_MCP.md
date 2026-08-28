# Configurer Lightning MCP pour Vellum / LIA

Package : [`lightning-wallet-mcp`](https://www.npmjs.com/package/lightning-wallet-mcp)  
Produit : [Lightning Faucet Build](https://lightningfaucet.com/build/)

## 1. Hôte ops uniquement

Ne **jamais** embarquer le MCP dans le front GitHub Pages.  
Exécution : machine Vellum / agent host (stdio MCP).

## 2. Config MCP (self-register)

Fichier exemple repo : [`.mcp.json.example`](../.mcp.json.example)

```json
{
  "mcpServers": {
    "lightning-wallet": {
      "command": "npx",
      "args": ["-y", "lightning-wallet-mcp"]
    }
  }
}
```

Puis demander à l’agent : *« Register a new Lightning Wallet operator account »*  
→ tool `register_operator` → **sauvegarder `api_key` + `recovery_code` hors git**.

## 3. Config avec clé déjà émise

```json
{
  "mcpServers": {
    "lightning-wallet": {
      "command": "npx",
      "args": ["-y", "lightning-wallet-mcp"],
      "env": {
        "LIGHTNING_WALLET_API_KEY": "lf_…"
      }
    }
  }
}
```

Env Vellum recommandé :

```text
LIGHTNING_WALLET_API_KEY=…    # secret vault
LIGHTNING_AGENT_LIVE=0        # 1 seulement après budget + tests
LIGHTNING_BUDGET_SATS_DAY=10000
```

## 4. CLI parallèle

```bash
npm i -g lightning-wallet-mcp
export LIGHTNING_WALLET_API_KEY=$(lw register --name "LIA-xArtists" | jq -r '.api_key')
lw balance
# lw pay-api "https://lightningfaucet.com/api/l402/fortune"
```

## 5. Outils utiles (extrait)

| Tool | Usage LIA |
|------|-----------|
| `register_operator` | Bootstrap ops |
| `check_balance` | Garde-fou budget |
| `pay_l402_api` / `lw pay-api` | APIs payantes micropaiement |
| `create_invoice` | Encaisser un service agent |
| `create_agent` / `fund_agent` | Sous-agents plafonnés |
| `withdraw` | Sortie self-custody |

## 6. Isolation xArtists

| Wallet | Usage |
|--------|--------|
| MultiversX LIA ops | Deploy SC, gas EGLD, tips MVX |
| Lightning operator | L402, micro-BTC, pas de $TRO |
| User xPortal | NFT, packs Pulse/Yield/Sentinel |

## 7. Front

Statut UI : https://neltud.github.io/xArtists/#/agents/lightning  
Pas de paiement Lightning depuis le navigateur utilisateur v1.
