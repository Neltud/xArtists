# Lightning Agent Wallet (Lightning Faucet MCP)

External capability for **AI agents** (LIA / Vellum / Claude / Cursor) — **Bitcoin Lightning**, not MultiversX.

Source product: [Lightning Faucet Build](https://lightningfaucet.com/build/) · npm `lightning-wallet-mcp`

## What it is

- MCP server: agent gets a Lightning wallet, balance, pay/receive tools
- CLI `lw` for bash agents
- L402 / pay-per-API micropayments
- Self-register via `register_operator` — no signup form in the classic sense
- Fees ~2% on payments (platform); withdraw to self-custody supported by product docs

## What it is NOT (xArtists scope)

- Not a MultiversX wallet
- Not $TRO / EGLD custody
- Not a replacement for user xPortal / sdk-dapp
- Not enabled in the browser dApp (no private keys in front)

## Integration model xArtists

| Layer | Role |
|-------|------|
| **Vellum / LIA ops host** | Optional MCP client: `npx lightning-wallet-mcp` for micro-payments (data APIs L402, tips BTC) |
| **Front dApp** | Documentation + status panel + entity branch only |
| **User** | Never forced; MVX remains primary for packs/NFT |

## MCP config (ops host only)

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

CLI:

```bash
npm i -g lightning-wallet-mcp
lw register --name "LIA-xArtists"
lw balance
# lw pay-api "https://…"   # L402
```

## Policy LIA

1. **Separate treasury** from MultiversX LIA ops EGLD wallet
2. **Budget cap** ops (sats/day) before any auto-pay
3. **No** mixing Lightning keys into GitHub Actions secrets without vault
4. Paper/demo UI until ops confirms `LIGHTNING_AGENT_LIVE=1` in Vellum env

## UI

- Panel: `LightningAgentPanel` · route hints `/agents` + intent `lightning` / `bitcoin` / `sats`
- Data: `data/lightning_agent.json`

## Links

- https://lightningfaucet.com/build/
- https://www.npmjs.com/package/lightning-wallet-mcp
