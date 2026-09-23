# Primordial Slot — SC & rewards (paper → mainnet)

## Product

- **UI**: `/slot` · temple pré-humanité · scatter anim · paper bank
- **Rewards**:
  - Mini: `$TRO`, `EGLD`
  - Jackpot soft: NFT 1/1 digital (video / music / numeric)
  - Jackpot hard: **RWA 1/1** certified painting / hard copy (ops claim)
- **Mode**: paper-first until SC `codeHash` verified on mainnet

## Wallet / deploy (ops)

- **Do not** put PEM in git.
- Preferred: ops machine or future Vellum workflow injects `SLOT_DEPLOY_PEM` env only.
- Separate **Slot treasury** wallet recommended (not LIA trading wallet).

## SC skeleton (future)

```
contracts/slot_primordial/
  - init(treasury, tro_token, fee_bps)
  - spin(payment) -> outcome entropy + escrow prize
  - claim_nft / claim_egld / claim_tro
  - admin_pause / set_paytable
```

Entropy: commit–reveal or on-chain VRF when available; until then paper RNG client-side only.

## First 100 / Phase 4

Slot jobs (verified spins / claims) can feed MX-8004 trust later — not required for paper demo.

## Checklist

1. [x] UI paper `/slot`
2. [ ] Paytable freeze + legal copy
3. [ ] SC draft + audit path
4. [ ] Deploy mainnet + codeHash in contracts.json
5. [ ] Wire claim buttons fail-open only when codeHash live
