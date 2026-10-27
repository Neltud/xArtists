# Multichain payment rails — buyer / seller

**Status:** product choice · paper 2026-10-27

## Principles

1. **Same economic value** (Rule 1) regardless of rail.  
2. **Server quote** locks rate + amounts; browser never sets price.  
3. **Seller settlement** defaults to MultiversX EGLD until off-ramp is production-ready.

## Buyer — pay-in

| Rail | Asset | When | Status |
|------|--------|------|--------|
| `eur_paybox` | EUR | Card / EU checkout | Sandbox IPN (P0) |
| `egld_multiversx` | EGLD | Wallet connected | Quote → user TX |
| `esdt_multiversx` | Whitelisted ESDT | Optional | Later |
| `btc_receive` | BTC | LIA ops only | **Not** retail P1 |
| `sol_receive` | SOL | LIA ops only | **Not** retail P1 |

Retail buyer P1: **`eur_paybox` | `egld_multiversx`**.

## Seller — settlement

| Rail | Asset | When | Status |
|------|--------|------|--------|
| `egld_multiversx` | EGLD | Default NFT escrow release | P1 |
| `eur_bank` | EUR | Off-ramp | Not in P1 |

## Mapping to escrow NFT

```
buyer chooses rail
  eur_paybox     → documented operator/fund path (no silent value mint)
  egld_multiversx → direct FUNDED in escrow SC
seller always receives egld_multiversx on SETTLED (P1)
```

## LIA wallets (do not confuse)

| Wallet | Role |
|--------|------|
| LIA ops | Paper trading / treasury experiments |
| LIA custody (buyers sans wallet) | Temporary hold → assess → burn métier |
| Escrow SC | P2P NFT trade funds + NFT |

Never stake BFY from **custody** wallets.
