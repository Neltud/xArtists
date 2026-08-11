# Burnify protocol × LIA

## Deux chemins

| Chemin | Qui | Rôle |
|--------|-----|------|
| **Protocol Burnify** | Wallet **LIA ops** | Stake **BFY**, batches **TRO**, **claim EGLD** après X batches |
| **xArtists tro-burn SC** | Users dApp | Burn TRO + pool EGLD xArtists |

## Boucle LIA (priorité)

1. **DEFENSE** — EGLD < gas_reserve → stop
2. **STAKE** — BFY libre → `deposit` staking SC
3. **CLAIM** — `batches_since_claim >= X` → `claimRewards` EGLD (**obligatoire**)
4. **BATCH** — TRO + EGLD + TRO listé → N batches
5. **IDLE**

Default: `claim_after_batches = 5`.

## Adresses mainnet

- BFY `BFY-8344ff`
- Staking `erd1qqqqqqqqqqqqqpgqm2mkm02pam4tvtykfs7e8w508vzfvjqrp4ssfrts0f`
- LIA ops `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

## Flags

```bash
LIA_LIVE_TRADING=1
LIA_BURNIFY_LIVE=1
PYTHONPATH=. python -m lia.burnify.agent
```

Sans les deux flags → **paper** (`data/burnify_lia_state.json`).

## Réf

https://litepaper.burnify.app/overview/how-it-works · https://burnify.app
