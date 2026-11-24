# xArtists — Solana programs

This isolated Anchor 0.32.1 workspace contains a native NFT marketplace and token-stake governance. It does not change or deploy the MultiversX contracts.

**Deployment state:** neither program is attested on devnet or mainnet. The IDs in Anchor.toml are deterministic local test identities, without deployment keys. The public frontend registry contains null for both public networks. A green test run does not release commercial gates or attest a TRO SPL mint.

## Marketplace v1

- Each signing authority creates its own market PDA. There is no global first-caller initialization race.
- The fee recipient and fee rate are immutable per market, capped at 10%. Only that authority can pause new listings or purchases.
- A listing takes custody of exactly one immutable, non-freezable classic SPL 1/1 NFT. Token-2022, programmable NFTs, Core and compressed assets are not supported in v1. Metadata, creator royalties and collection authenticity are not inferred.
- Sale IDs increase monotonically. A closed listing cannot be reused to execute an old purchase against a relisting.
- Purchase checks the expected atomic SOL price and expiration, pins the treasury and seller, pays the exact fee/proceeds and delivers the NFT in one instruction. Any failed CPI rolls back payments.
- Seller cancellation works even when the market is paused or a listing has expired. The operator has no NFT seizure endpoint. Listing/vault rent returns to the seller.

## Governance v1

- Each DAO is scoped to its signing authority and an immutable, non-freezable SPL mint. This does not create or authenticate a Solana representation of TRO.
- Stake is held by a DAO vault; a program-owned position records each owner's deposited amount.
- A proposal requires qualifying stake, bounded title/URI and a voting period of one hour to thirty days.
- Voting records one receipt per owner/proposal, uses only deposited stake, and locks withdrawal until the latest proposal voted on ends. A proposer is also locked through that proposal's end.
- Quorum, strict majority and overflow checks determine the final result. Finalization is permissionless after the deadline.
- Pausing blocks new stakes/proposals; existing votes, finalization and eligible withdrawals remain possible.
- A passed proposal records a result. It does not execute arbitrary instructions, move treasury assets or authorize an upgrade.

## Reproduce local verification

Use a current host Rust toolchain and the pinned SBF builder:

```sh
cargo install cargo-build-sbf --version 4.6.0 --locked
cargo fmt --manifest-path contracts/solana/Cargo.toml --all -- --check
cargo-build-sbf --manifest-path contracts/solana/Cargo.toml --workspace --arch v0 --sbf-out-dir "$PWD/contracts/solana/target/deploy" -- --locked
BPF_OUT_DIR="$PWD/contracts/solana/target/deploy" cargo test --manifest-path contracts/solana/Cargo.toml --workspace --locked
```

Runtime tests load the compiled SBF bytecode and canonical SPL/ATA programs in ProgramTest. Signers and lamports exist only in memory. There is no RPC, airdrop, owner-wallet access or transaction broadcast. Build output and generated test key files stay under ignored target/.

The frontend SDK at apps/frontend/src/lib/solanaInstructions.ts builds unsigned local-development descriptors. It uses bigint for atomic amounts and refuses mainnet/devnet instructions while their deployment records are absent.

## Before any public financial release

Independently review the programs and standard/royalty scope; establish owner-controlled deployment IDs; build reproducible binaries; deploy and verify hashes, cluster genesis, authorities and configured market/DAO accounts; run signed multi-wallet lifecycle proofs with receipts. Only then propose a separate reviewed change to the frontend deployment registry and financial release gates. No secret or private key belongs in this repository or a frontend environment variable.

The workflow .github/workflows/solana-programs-ci.yml builds both binaries and uploads only .so files and hashes, never generated keypair files.
