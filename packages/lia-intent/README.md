# LIA Intent — paper BUY_PACK

Server-only TypeScript package. It validates extraction candidates, locks the existing pack quote for at most 30 seconds, prepares a scoped preview, and simulates BUY_PACK after explicit confirmation. It has no payment writer, signer, mint, transfer or relayer adapter.

This package is a first implementation slice, not a production financial execution service. It is not wired into the Command Bar or Access API yet. AP2, ACP, Relayed v3 and MX-8004 integration remain separate compatibility work; `xartists.lia.paper_mandate.v1` is an internal preview format, not an AP2 credential.

## Run

From this directory on Node 22 or newer:

```bash
npm ci --ignore-scripts
npm test
```

`npm test` compiles with strict TypeScript and runs Node tests against `services/access-api/src/quote.mjs`. The package has its own dependency lock and does not change the frontend dependency graph.

## Host integration

The host must authenticate the actor itself and provide an internal, read-only quote adapter. Never copy the actor, catalogue, policy or adapter URL from a client request.

```typescript
import { createPaperIntentService } from '@xartists/lia-intent'
// Imports below belong to the authenticated server, not the browser.
import { buildPackQuote, PACK_FIAT_CENTS } from './existing-quote-engine.js'

const lia = createPaperIntentService({
  catalogue: PACK_FIAT_CENTS,
  guardian: () => ({ paused: serverCircuitBreaker.isPaused() }),
  quoteProvider: async ({ packTier, nowMs, signal }) => {
    const rate = await serverFxReader.eurPerEgld({ signal })
    return buildPackQuote({ pack_id: packTier, rate_eur_per_egld: rate, now: nowMs })
  },
})

const actor = { userAddress: authenticatedSession.walletAddress }
const preview = await lia.processCommand({
  raw: 'Achète-moi le pack Pulse à 110€ et envoie le NFT sur mon wallet',
  paymentRail: 'egld_multiversx', // Explicit UI choice; EUR catalogue price does not choose the rail.
}, actor)

// Present the exact preview first. Only a user click on “Simuler” calls this branch.
if (preview.status === 'ready' && userClickedSimulate) {
  const receipt = lia.confirmMandate({ mandateId: preview.mandate.id, digest: preview.digest }, actor)
  // receipt.status === 'simulated'; paymentVerified/deliveryVerified === false.
}
```

The integration example names host ports that are not supplied by this package. It does not create a working HTTP route, FX provider or authentication implementation.

## Contracts and behavior

- `CandidateSchema`: ten recognized intent types, strict per-action slots, bounded amounts, checksum-validated MultiversX addresses. Only BUY_PACK is allowed by this service.
- `processCommand(request, actor, signal?)`: returns `clarify`, `blocked` or a paper `ready` preview. Candidate confidence is a routing threshold, never financial authority. The default rules parser accepts a narrow French/English purchase grammar and rejects trailing/mixed instructions.
- Optional `classifier({raw, signal})`: one bounded read returning an untrusted object or JSON string. No model provider, model call or live quality claim is included. A malformed/low-confidence result clarifies; adapter failure/timeout blocks, with no automatic retry.
- Quote adapter: uses the existing Rule1 engine, checks catalogue anchors and exact integer ceil4 parity, retains the 4% margin as accounting only, caps TTL at 30 seconds. Balances and gas are explicitly unverified; no zero-gas estimate is invented.
- `confirmMandate({mandateId, digest}, actor)`: confirms the stored paper preview and returns a simulated receipt. It checks ownership, digest, state, expiry, Guardian and daily limits. Duplicate confirmation returns the same receipt without another quota charge.
- `cancelMandate(...)`: idempotent before simulation. A cancelled preview cannot be simulated.
- No request field can set paper/live mode, autosign, a signature, user identity, quote, plan or action allowlist. SIWX login and Genesis ownership do not authorize spending.

Amounts are atomic decimal strings at the package boundary. EUR catalogue prices are safe integer cents. The adapter accepts legacy numeric quote inputs only to revalidate them using integer arithmetic; precision loss, scientific notation or parity mismatch blocks preparation.

## Limits and disable path

The ledger, daily limits and idempotency records are bounded **in memory**. Restarting the process loses them. No durable multi-instance replay, distributed quotas or wallet authorization is provided. Do not repurpose this ledger for live money.

Stop the host integration or return `{paused: true}` from Guardian to disable preparation and confirmation. Invalid/unavailable Guardian state blocks both. Cancellation remains available while paused. Inherited `VITE_LIA_LIVE_TRADING=1` or `LIA_LIVE_TRADING=1` cannot add live capabilities to this package.

Dependencies receive abort signals and timeouts; they must remain read-only and honor cancellation where possible. This package cannot forcibly stop a non-cooperative adapter. There are no retrying external writes or simulated financial rollbacks.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the production integration design and remaining release gates.
