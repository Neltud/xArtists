# PayBox.sh Solana — non-spending wallet-control proof

**Status (4 November 2026): implementation fixture only; no PayBox OAuth connection, live signature, transaction, spend authority, bridge or swap.** This document describes a reviewable protocol, not a completed wallet-access audit.

## Existing public funding evidence

- Intended recipient / owner-attested PayBox \`sol-default\` wallet: \`Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN\`.
- Read-only public Solscan receipt: https://solscan.io/tx/3bBfnU1zR5aK6NyCsoT2oHgbnq4kTYoU9PMABVii86aW9x7VHvGA9EsTeZNX9F95mXVxTvLeMnJ2jJ7795baRdz6
- SOL received: 9,938,000 lamports (0.009938 SOL); marked SUCCESS/finalized by Solscan; block 465338949; UTC 2026-11-04 14:40:40. Revolut Hot Wallet was the displayed sender, but sender ownership was not independently established.
- A funded address is **not evidence** that the intended PayBox grant currently controls the private key. Do not close #353 from the receipt alone.

## Official protocol evidence

PayBox docs: https://docs.paybox.sh/connect/mcp and https://docs.paybox.sh/reference/mcp-tools.

- OAuth 2.1 + PKCE grant to \`https://api.paybox.sh/mcp\`. The agent receives only credentials currently granted to its OAuth client.
- \`list_credentials\` is read-only and shows the active wallet's \`credential_id\`, \`kind:wallet\`, \`metadata.address\`, \`metadata.chains:["solana"]\`, and approval mode. A legacy name \`sol-default\` must not be treated as a current credential ID.
- \`request_wallet_sign\` with \`intent:{op:"solanaMessage",address:"<base58>",message:"<exact challenge string>"}\` asks the **user** to sign an off-chain message, and on completion returns a **hex Ed25519 signature**. This step is a user-authorized cryptographic signing operation, **not read-only**, but moves no funds.
- On \`pending_approval\` or \`pending_signature\`, poll \`get_request\` with the original request ID; never resubmit \`request_wallet_sign\` to resume a pending request. Use the official passkey / signing-window flow. NEVER request transaction signing, swaps or transfers as a workaround.
- The existing MoonPay portfolio balance plugin and public explorer are different data providers; neither establishes PayBox OAuth grants or wallet control.

## Implemented paper-only verifier

\`services/access-api/src/payboxWalletControl.mjs\` exports \`createPayboxSolanaProofGate\` and \`verifySolanaMessageSignature\`.

The server must inject:
1. \`expectedAddress\` from reviewed server configuration, not client parameters.
2. \`getCredential({actorId,credentialId,signal})\` reading an actual **authenticated and scoped** PayBox \`list_credentials\` response. It must reject ungranted, EVM, wrong-wallet and stale credentials. No provider HTTP implementation is included.
3. \`guardian\` returning exactly \`{paused:false,mode:"proof-only"}\`, a trusted authenticated actor ID from host auth, and durable tenant-specific rate limits.

Workflow: \`prepare({credentialId},actor)\` checks the current grant and returns an exact, actor/domain/chain/wallet/credential-bound string with a fresh random nonce and at most 120s TTL. User reviews and signs **that exact string** with \`request_wallet_sign\` / \`solanaMessage\`; \`confirm({challengeId,signatureHex},actor)\` checks the grant again, verifies the 64-byte Ed25519 signature against the pinned 32-byte Solana pubkey and locks the challenge. Owner-only \`status\` and \`cancel\` do not touch money.

The receipt deliberately returns \`spendAuthorized:false\`, \`payboxLiveIntegrationVerified:false\` and \`chainTransactionHash:null\`. Successful **mocked** verification is not proof of a current PayBox account. An unsigned browser return, a matching address alone or a confirmed incoming SOL transfer must not set the verified status.

### Conditions before an API endpoint can be exposed

- Durable atomic nonce state in PostgreSQL (single-use across replicas and restarts); audited actor binding, CSRF/origin checks and rate limits.
- Server-authenticated PayBox OAuth, token lifecycle and scoped credential lookup, with no bearer tokens in browser logs. Do not accept a client-supplied \`getCredential\` result.
- Verified current grant and passkey approval using PayBox's real UI; compare exact public address. Store only challenge/signature hashes and redacted timestamps.
- Confirm provider's actual \`solanaMessage\` bytes are exactly the UTF-8 challenge and recheck the digest; adapt only with deliberate conformance tests.
- Live evidence should include provider request ID/status, signature verification result and current credential read; wallet control verification still does **not** authorize a swap, bridge, public token sale or LP deposit.

### Tests, disable, rollback

Run \`cd services/access-api && node --test tests/paybox-wallet-control.test.mjs\` under Node 22. The tests create disposable in-memory Ed25519 test keys and fake OAuth-grant readers. They do not call PayBox, Solscan, MoonPay or external networks.

For production disable or rollback, leave the module unimported by HTTP routes; or pause Guardian. The signer must remain accessible **only to the authorized user in PayBox**, never via PEM / server keys or an automatic wallet agent.

**Commercial status remains NO-GO**. Keep \`paybox_checkout_enabled\`, \`mint_live_enabled\`, \`LIA_LIVE_TRADING\` and all bridge/LP routing gates off. Solana balance 0.009938 SOL is below the project's current 0.02 SOL operational gas reserve; do not attempt any swap.
