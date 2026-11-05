# Genesis Art Engine — paper contract, not live generation

**4 November 2026 · Scope: isolated draft · commercial status: NO-GO.**

Bounded server-only creator-image adapter. This package does not configure an AI provider, charge paid credits, persist media, pin IPFS, list/mint NFTs, touch treasury, or execute bridges. A unit test using fake provider output is not evidence of live image generation.

## Execution path

    Creator Studio / Command Bar
        -> authenticated server actor
        -> paper quote (creator_artwork only)
        -> explicit confirmation
        -> in-memory credit reservation
        -> injected image provider (not configured by this package)
        -> injected Creator Studio validateCreatorMedia
        -> artist review
        -> separately authorized Pinata upload
        -> separately signed NFT mint (closed)

- Public interface: prepare(command, authenticatedActor), confirmPaper({quoteId,digest},authenticatedActor), status, cancel, readCredits. The quote expires within 30 seconds and carries a digest binding owner, prompt hash, version and fixed paper price. A digest is not a financial signature or AP2 mandate.
- The hosting server must authenticate and authorize actorId. Never accept actorId, price, provider URL, rights assertions beyond explicit consent, or Guardian status from client JSON. Inject the existing validateCreatorMedia function from services/access-api/src/creatorMedia.mjs. Unavailable Guardian, image adapter or media validator fail closed.
- Only image and creator_artwork are supported. The Genesis access-pack families XAIPLS, XAIYLD, XAISNT are not generic writable artist NFT collections. No video, 3D, physical artwork transfer, or guaranteed resale royalty is implied.
- A successful paper adapter returns only MIME, byte count, SHA-256, owner and null image URI. It does not persist the actual binary, provide a preview-asset retrieval endpoint or write metadata. Receipts explicitly keep paymentVerified, metadataPinned and nftMinted false, and chainTxHash null.
- Idempotency: one completed confirmation consumes one paper reservation; a duplicate returns the same receipt. Concurrent confirmation does not double debit within this one process. Known failures release reservation. Provider timeouts are ambiguous: they hold paper credits in needs_reconciliation and never retry automatically.
- PAPER_CREDITS are test-only balances, not paid credits, gross revenue, spend authority or a durable billing system. This in-memory journal is not multi-instance safe; its bounded quote capacity intentionally stops at maxQuotes. Add durable state, retention and distributed quotas before host integration.

## Local verification

From packages/genesis-art-engine, run: npm test

The dependency-free Node 22 test suite exercises ownership, expiry, confirmation digest, rights, Guardian, replay, concurrent request, provider media validation and unknown provider outcome.

## Production backlog and gates

1. Select and contractually verify a real image-generation provider: rights, supported media, safety moderation, data locality, versioned unit cost, quotas, refund/retry terms and provenance. An AMD local-image route is an optional future desktop deployment, not automatically supported by a hosted browser. Do not report generated output until a controlled real-provider test exists.
2. Connect through the existing authenticated Creator Studio, import its media content validator, implement bounded asset retention/retrieval and explicit artist approval, then use the existing guarded IPFS path. Never let the model pin metadata or sign transactions.
3. Persist quote, job, credit reservation and reconciliation with PostgreSQL transaction boundaries; add per-user quotas, retries only where provably read-only, and provider receipts. Do not add paid credits before a real accounting ledger and independently validated PSP evidence.
4. Build a 390px-mobile-first review state showing simulation, credit version, expiry, provider health, accessible status and separate not-uploaded / not-minted truth. Never infer LIVE from last refresh time alone.
5. Mint is a separately signed, policy-checked adapter. Require validated collection ID, royalties and artist rights, delivery proof, PayBox S1/S2 and refunds before considering live. Maintain commercial and trading flags disabled.

See GitHub issue #373 for end-to-end scope and LIA core PR #366. The current package does not close those gates.

**Disable/rollback:** do not import this module into runtime routes; or supply a Guardian that is paused. The package currently has no live HTTP endpoint.
