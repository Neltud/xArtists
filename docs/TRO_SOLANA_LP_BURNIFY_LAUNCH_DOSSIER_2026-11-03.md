# $TRO — Solana LP, sale proceeds & Burnify: design dossier (NO-GO)

**Audit date: 2026-11-03 · Read-only and non-executable.** This document is an engineering and compliance plan, **not** a token offering or a bridge deployment.

## Canonical asset and exact accounting

- Mainnet MultiversX native token: `TRO-94c925`, decimals `6`.
- Issuer control reference: `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l`.
- Snapshot from official public token + supply endpoints at review time: `initialMinted=500000000000`, `minted=0`, `burnt=23776101161` atomic units.
- Hence **exact reported non-burned total = 476223898839 atomic = 476223.898839 TRO**. The API's `476224` is rounded. This is an observation, not a signed reserve attestation. Issuer API flags include `canMint=true`, `canUpgrade=true` and `canChangeOwner=true`.
- Read-only script: `node scripts/tro_supply_audit.mjs`. Tests: `node --test apps/frontend/tests/tro-crosschain-guard.test.mjs`. Must independently verify token manager and special roles before bridge issuance.
- Historic pool reference `data/tro_pool.json` previously mislabelled the same asset as **18 decimals** and contained a stale USD liquidity figure. Treat this as historical metadata only, **not as capital or NAV**.

## Exact distinction: bridge, issuance, liquidity and burn

| Action | What it actually does | What it does NOT do |
| --- | --- | --- |
| Lock native TRO in audited MultiversX escrow | Creates provable collateral to support a fixed number of representative Solana units | Does not create a pool or confer a right to mint uncollateralized units |
| Mint backed SPL representation after finalized, attested lock | Increases circulating representations on Solana, bounded by collateral | Does not create fresh unbacked economic TRO supply |
| Deposit backed SPL TRO **and** SOL/USDC to a Raydium CPMM pool | Creates a two-asset liquidity reserve and a market price by deposit ratio | Does not guarantee price, buyers or a stable value |
| Allocate sale proceeds or verified fees into LP | Can grow existing reserves when the treasury actually owns both assets and executes signed add-liquidity operations | No default Pump.fun mechanic redirects 100% of customer payments to creator LP |
| Burn TRO on Burnify (MultiversX) | Permanently reduces **eligible, unencumbered** TRO native supply, if a real Burnify protocol batch finalizes | Is **not** a bridge transfer, not LP funding, and does not automatically back SPL tokens |
| Redeem bridged TRO | Burns the Solana representation before releasing the equivalent locked MultiversX assets | Must not burn the locked collateral on Burnify before obligations are extinguished |

**Invariant:** `solana_representations_outstanding <= eligible_native_tro_escrowed`, after integer conversion; do not count burned native assets, treasury inventory or LP deposits twice. No on-chain authority, credential or deposit instruction exists in this repository that makes this invariant operational today.

## Why direct Raydium CPMM is a better eventual fit than creating a new Pump.fun TRO

The native asset already has an identity and 500k initial historical issuance. A *new* Pump.fun token is its own independent issuance on Solana; default supply/bonding curve and token economics cannot prove it represents existing MultiversX TRO. Pump.fun takes buys into a bonding curve and migrates reserves to a PumpSwap canonical pool after graduation; creator fees and protocol LP fees are distinct. Even when creator fees can be directed to a designated recipient, claims must be accounted for and extra liquidity explicitly added by authorized signers.

**Recommended, conditional architecture:** audited 1:1 wrapper or canonical token policy first → verified Solana SPL mint + escrow reserve attestation → Raydium CPMM with pair `TRO/SOL` or `TRO/USDC` → treasury multisig policy allowing a fixed *percentage of actual collected primary-sale proceeds and/or creator fees* to be converted/paired and added as LP only after each action has on-chain evidence. Record every deposit, claim, LP mint, rebalance and fees separately. A voluntary treasury allocation example such as 70% to LP is **not a platform fee or implemented setting**; the actual number must be approved and disclosed by governance and a legal adviser. LP shares should be subject to published lock/custody and redemption policies. Pool cannot be initialized with non-existent SPL mint or funds.

Potential venue: [Raydium CPMM pool setup](https://github.com/raydium-io/raydium-docs-v1/blob/main/user-flows/create-cpmm-pool.mdx). The setup requires both tokens, a funded signing wallet and a confirmed initial price. [Pump.fun fee documentation](https://pump.fun/docs/fees) should be rechecked immediately before any alternative launch.

## Burnify protocol — NEVER interpret local intents as executed burns

- The latest accessible public Burnify litepaper describes approximately 24h cycles; a batch notionally combines **0.015 EGLD + TRO/other eligible token worth 0.015 EGLD**, slippage/cycle settings and listing-dependent acceptance. Its examples do not attest **TRO** is presently eligible.
- The repository's `lia/burnify/tx_builder.py` currently returns a placeholder `receiver: BURNIFY_BATCH_SC` for TRO batches, **not an executable signed transfer**. That is why the default `tro_listed` must be **false** until listing and exact receiver/ABI verified independently from the live protocol.
- Sending EGLD or TRO to any unverified address, or assuming the agent executed a burn because paper state shows a batch, is unsafe. Keep `LIA_LIVE_TRADING=0` and `LIA_BURNIFY_LIVE=0`.
- For a future manually authorized microbatch, require official allowlist proof, exact live token amount by quote/slippage, approved recipient and ABI, user/LIA ops signed transaction, finality, a burn event or verifiable supply reduction, and an immutable on-chain tx hash. Never burn escrow collateral held for Solana redemptions.
- No scheduled batch, fee claim or bridge interaction is enabled by these source changes.

## GO gates for any public primary sale or LP

1. **Identity/rights:** Wallet-signed confirmation from authorized native issuer; supply, mint rights and project treasury/wallet ownership documented; official SPL mint and independent signers published.
2. **Bridge/collateral:** On-chain escrow deployed to testnet, audited, pause and finality tested; dual-chain reserve accounting, relayer anti-replay, testnet redeem with witness, mainnet independent review.
3. **Economics:** Fixed policy for current TRO allocations and sale inventory; transparent exchange rates and slippage, source of SOL or USDC, on-chain LP share custody, authority changes and public event ledger. Do not represent price appreciation or yields as guaranteed.
4. **Consumer/legal:** France/EU MiCA qualification, identity of legal offeror, white-paper notification or documented exemption where applicable, marketing disclosures, service-provider and tax review, sanctions screening and incident refunds; obtain qualified legal review before fundraising.
5. **Execution:** Explicit human multisig signing of *each* irreversibly funded on-chain action; small bounded amount after proven devnet flow. Never put seeds in GitHub, Render, Vercel, ChatGPT, or a CI secret.
6. **Release controls:** `/v1/tro/bridge/status` remains disabled; `tro_solana_bridge=off`. No Solana address, quote or buy button should be claimed live until independent proof.

**References:** [MultiversX token model](https://docs.multiversx.com/tokens/fungible-tokens/), [MultiversX Ad-Astra limits](https://docs.multiversx.com/bridge/architecture/), [Burnify litepaper](https://litepaper.burnify.app/overview/how-it-works), [Raydium](https://github.com/raydium-io/raydium-docs-v1/blob/main/user-flows/create-cpmm-pool.mdx), [MiCA article 4](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-4-offers-public-crypto-assets-other).
