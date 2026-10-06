# TCA access — Pack Pulse gatekeeper

## Hierarchy

| Status | Condition | Experience |
|--------|-----------|------------|
| **FULL** | Active Pulse (`now < activatedAt + 365d`) | Classroom + unlimited RAG Q&A + HD |
| **SAMPLE** | No pack or expired | One sample lesson (`sample_01`) |
| **NONE** | Explicit lobby-only | Gallery / Pulse info |

## Air-gap

```
Wallet / index  →  resolveTcaAccess(packIds, activatedAt)
                         ↓
                    UI grant only
                         ✗
              never mint / never ledger write from TCA
```

Mint / buy Pulse = **Genesis / Agents / MoonPay** paths only.

## API

```ts
import { resolveTcaAccess, resolveTcaAccessForWallet } from '../lib/tcaAccess'

const access = resolveTcaAccess(['pulse_pack_v1'], { activatedAtMs: Date.now() })
// access.status === 'FULL' | 'SAMPLE' | 'NONE'
// access.hasAccess, access.expiryDate, access.sampleLessonId
```

Wire `packIds` from NFT inventory when Pulse collection is live on mainnet.
