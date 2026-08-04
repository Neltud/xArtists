# Clés API · Droits NFT · Stake agent

## Clés API (`lia/agents/api_keys.py`)

- Stockage : **hash HMAC** seulement (`data/agent_api_keys.json`)
- Pepper : env `XARTISTS_API_KEY_PEPPER` (Vellum secrets)
- Scopes autorisés : `signals:read`, `status:read` — **jamais** `tx:sign` / `live:trade` / `pem`
- TTL, rate limit, révocation
- `raw_key` affiché **une fois** à l’émission

## Droits NFT (`lia/agents/nft_rights.py`)

| Flag | Défaut |
|------|--------|
| can_use | true |
| can_resell | true |
| can_sublicense | false |
| commercial_ok | true |
| physical_lock | false (metadata only) |

Transfert NFT → révoque ancienne clé, force re-bind.

## Stake fonds de départ (`lia/agents/agent_stake.py`)

- User alloue **principal EGLD** (min 0.05 · max 50) à **son** agent acheté
- Livre séparé du book protocole LIA
- `agent_live` défaut **false** (opt-in user ; clé API ne signe pas)
- Escrow on-chain = évolution SC future

## Fulfillment post-buy

```bash
python -m lia.agents.fulfillment
# grant rights + issue key + optional open_stake
```

Dépend encore du deploy `agents_marketplace` pour le paiement on-chain.
