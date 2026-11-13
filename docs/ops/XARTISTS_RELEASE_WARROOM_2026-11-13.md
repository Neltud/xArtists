# xArtists / xOrus — P0 release war room, issues & PRs, multi-rail roadmap

**Snapshot:** 13 November 2026 (GitHub linked repository: `Neltud/xArtists`).
**Authority:** engineering triage document, **not** an authorization to move funds,
mint NFT, deploy smart contracts or open commercial checkout.

## Non-negotiable product model

- **Sell original xOrus analysis** (Pulse markets, Yield DeFi scenarios, Sentinel
  risk), with verified provenance, age, independent corroboration and
  explanations. **Never sell or expose third-party raw data**.
- Studios, artists and galleries may create 3D exhibitions, manage objects and
  list NFT only via verified ownership, exact network, wallet signature and
  actual order/receipt verification. 3D preview is not mint or title.
- Email accounts **without a wallet** are first-class (fiat EUR subscription);
  verified optional MultiversX wallet enables separately signed NFT/EGLD flows.
- Crypto ops Solana, PayBox.sh wallet, Paybox System/Verifone card PSP,
  EGLD NFT escrow and subscriptions are **four separate trust/payment rails**.
- xOrus decisions remain advisory: source rights + independent sources +
  Sentinel veto, Chair <=15%, stale/no data => `ABSTAIN`; no autonomous live trading.

## Status vocabulary

- `CODE`: implementation or branch exists, no production claim.
- `CI`: tests succeeded on **that exact SHA**, not proof of live runtime.
- `PUBLIC OBSERVED`: public endpoint checked with time and deployed SHA.
- `FINANCIAL VERIFIED`: provider-signed payment **and** durable reconciliation.
- `CHAIN VERIFIED`: exact finalized chain transaction, NFT owner and settlement.
- `LICENSE VERIFIED`: signed or otherwise independently established right for
  the precise *commercial analysis* use case.
- `GO`: release gate signed off, deployment observed, rollback demonstrated.
  Never convert `CODE` or `CI` into `GO` by wording alone.

## Open issues — owner of each missing release proof

| Issue | Rail | Exit criterion (must all be evidenced) |
| --- | --- | --- |
| [#281](https://github.com/Neltud/xArtists/issues/281) | Mint delivery / Neon | Identified prod DSN, isolated test DB, S1 PSP, S2 chain, transaction-atomic `delivered_at`, retries and refunds |
| [#428](https://github.com/Neltud/xArtists/issues/428) | Marketplace EGLD | Contract codeHash/ABI, two-wallet test, listing/bid/buy/royalties and actual buyer receipt |
| [#548](https://github.com/Neltud/xArtists/issues/548) | xOrus commercial | Private derived reports, commercial source rights, account entitlements/quotas, recurring PSP, revocation |
| [#570](https://github.com/Neltud/xArtists/issues/570) | Jupiter Solana | Decode and independently validate unsigned message, mints, owners, programs, simulation and explicit signing policy |
| [#465](https://github.com/Neltud/xArtists/issues/465) | Identity | Verified email login, stable server identity, optional domain-bound SIWX link, EU subscription billing |
| [#506](https://github.com/Neltud/xArtists/issues/506) | xPortal | Reown allowlist `xartists.art` / `www.xartists.art`, real browser QR/pairing on mobile, no stuck state |
| [#487](https://github.com/Neltud/xArtists/issues/487) | Artprice | Written B2B rights, approved fields/datasets/derivatives, no scraping or fake license |
| [#341](https://github.com/Neltud/xArtists/issues/341) | Domain / contact | Remove registrar hold, DNS A/NS/MX, SPF/DMARC, real inbound/outbound external mailbox tests |
| [#347](https://github.com/Neltud/xArtists/issues/347) | xOrus telemetry | Fresh authenticated producer, real timestamps + independent provenance; ABSTAIN if stale |
| [#393](https://github.com/Neltud/xArtists/issues/393) | Dapp 360 UX | Mobile/desktop keyboard and user journey tests for all visible modules; clear demo/live status |
| [#403](https://github.com/Neltud/xArtists/issues/403) | Genesis Pulse #005 | Rights-cleared media, actual IPFS, exact bytes, signed mint, finality and owner readback |
| [#416](https://github.com/Neltud/xArtists/issues/416) | XA World Rights | Correct software licensing, legal ownership, public ZIP/distribution policy, entitlement guard |
| [#367](https://github.com/Neltud/xArtists/issues/367) | BUY_PACK paper | Structured intent only, immutable quote, replay guard, server journal, public E2E without trade |
| [#391](https://github.com/Neltud/xArtists/issues/391) | Solana/Polygon NFT | Rights-cleared discovery first, no unsupported OpenSea transaction; testnet before mainnet |

**No issue above should be closed only because a mock test passed.** A PR
implementation and a publicly observed final receipt are distinct evidence.

## PR treatment — conflict-aware, no bulk merge

| PR | Decision | Reason |
| --- | --- | --- |
| [#573](https://github.com/Neltud/xArtists/pull/573) | MERGED to main | Fail-close Jupiter signing until independent presign audit; not a live trade |
| [#574](https://github.com/Neltud/xArtists/pull/574) | MERGED to main | Read-only finalized SOL native receipt; no PayBox.sh connection or funds credited |
| [#454](https://github.com/Neltud/xArtists/pull/454) | CLOSED (not merged) | Legacy LIA NLP/HMAC mandate out of #367 scoped P0 and duplicates xOrus architecture |
| [#476](https://github.com/Neltud/xArtists/pull/476) | HOLD / rebase | Domain RDAP DNS gate; avoid false mailbox GO, verify conflicts |
| [#477](https://github.com/Neltud/xArtists/pull/477) | DRAFT / consolidate | Owner go-live decisions are prep, not payment proof |
| [#478](https://github.com/Neltud/xArtists/pull/478) | DRAFT / consolidate | Commercial GO-by-rail document; no financial activation |
| [#457](https://github.com/Neltud/xArtists/pull/457) | HOLD | Three.js/esbuild coordinated version upgrade; full 3D smoke mandatory |
| [#459](https://github.com/Neltud/xArtists/pull/459) | HOLD | WalletConnect major upgrade during unresolved #506; reproduce browser failures first |
| [#458](https://github.com/Neltud/xArtists/pull/458) | HOLD | TypeScript major migration; do not bypass build/tests |
| [#430](https://github.com/Neltud/xArtists/pull/430) | DRAFT / NO-UPGRADE | RWA escrow storage incompatible with existing serialized records |
| [#407](https://github.com/Neltud/xArtists/pull/407) | DRAFT / NO-MINT | Pulse #005 rights/IPFS/contract deployment and wallet proof absent |

## Release lanes and ordering

### Soft-launch navigation policy — operator decision 13 Nov

The default module navigator, group hubs, search and related sidebar use one
**editorial** allowlist: `museum`, `market`, `maison`, `lia` (xOrus),
`agents`, `packs`, `studio`, `gallery-builder`, `wallet`, `account`,
`tro-crosschain` (information only), `status`, `legal`, `guide`, `app`.
The DAO remains reachable from the homepage and the advanced menu, but is
not a default dock/desktop entry. Auctions and RWA remain direct-linkable and
available in the expanded mobile menu; neither is a verified sale.

**Advanced access** remains available with `/directory?lab=1` (or owner
localStorage override) and direct URLs/aliases. It is NOT an authorization
for premium products or financial execution. Do not remove valid routes,
customer-owned resources or bookmarked URLs.

**Release acceptance:** verify all 44 module definitions / deep-link aliases,
five mobile dock destinations, desktop nav, eight translations,
readiness badges and accessible mobile menu at 360/390/430 px. Test the actual
published SHA and root + nested routes. Revert the navigation commit if
searchable core routes disappear or financial false-LIVE labels reappear.

### Domain and commercial mailbox — public recheck 13 Nov (issue #341)

**PUBLIC OBSERVED / DNS, not mailbox GO:** Authoritative `.art` RDAP
(`https://rdap.centralnic.com/art/domain/xartists.art`) lists
`client transfer prohibited`, `client delete prohibited`, `auto renew period`,
with **no active clientHold/serverHold** in the 13 Nov 2026 observation.
Google DNS-over-HTTPS NS resolves to OVH `dns107.ovh.net`/`ns107.ovh.net`;
MX resolves to `1 mail.xartists.art.`; SPF is present; DMARC publishes `p=reject`.
The apex A set matches GitHub Pages, and the `www` CNAME targets
`neltud.github.io`. These are DNS observations only, not live HTTP/email proofs.

PR #476 was prepared against an old base and its historic CI included failures.
The follow-up code is deliberately **read-only**, pins an authoritative RDAP URL
to avoid redirect failure, redacts private RDAP records and always reports
`domain_release_ready:false` / `email_send_receive_verified:false`.
Run `cd services/access-api && npm run ops:domain:check` manually for the
latest public snapshot; its synthetic CI never performs operator changes.

**Outstanding:** verify an actual existing `hello@xartists.art` mailbox,
receive two independent real test messages and complete an outbound reply with
redacted SPF/DKIM/DMARC headers. Until all pass, **NO-GO commercial email**;
do not infer deliverability from published DNS alone.

### Lane 0 — Public discovery and honest catalogue (first safe launch)
1. Confirm registrar/domain, DNS, Pages output SHA and deep-link routing.
2. Run release, route and mobile-browser smoke on **deployed** commit. Check
   360/390/430 widths, desktop, keyboard, FR/EN navigation and WCAG basics.
3. Publish xOrus decision explanations, source age, coverage and data rights
   with `paper_only` labeling. Every page may be navigable without a wallet.
4. Catalog prices must be server-sourced and clearly marked **unavailable**
   until entitlements and PSP are proven. No fake badges such as “live signal”.
5. Validate Reown origin allowlist with real xPortal QR/pairing and cancellation.

### Lane 1 — Usable analysis subscriptions in EUR (no wallet required)
1. Real email OTP + verified auth + anti-abuse, data export/delete, user sessions.
2. Approved free sources: Eurostat original datasets, Met CC0 items,
   Smithsonian CC0 items *only within their rights*; independent chain-native
   evidence after use-right verification. Each data pack needs license reference,
   canonical data identity, source time and real corroboration.
3. Build server-side ingestion, provenance signatures, scoring, Sentinel veto
   and original private reports; never send supplier source data to the client.
4. Stable PostgreSQL production identity, audited migrations + backups,
   tenant isolation + idempotent `account/report/entitlement` enforcement.
5. Versioned prices and legal terms; Stripe recurring EUR verified webhook
   (paid, failed, refunded, canceled), quota/rate limits and instant revocation.
6. Test: customer without wallet subscribes, obtains only authorized original
   report, loses access on cancel/refund; no NFT is minted.

### Lane 2 — Physical sculpture, creators, 3D gallery and MultiversX NFT
1. Studio: create sculpture from photo/scans with ownership declaration;
   publish an optimized GLB/scene, preview before any blockchain claim.
2. Creator gallery: private/public venue URL, curation, accessibility, room
   loading and asset moderation; listing UI only for actual owned NFTs.
3. Verify IPFS upload, per-file hash, immutable metadata URI and media rights.
4. xPortal SIWX + exact NFT ownership, contract ABI/codeHash, deterministic
   signed `list/buy/bid` operations and royalty/failure tests.
5. Payment S1 + chain S2 fulfillment, delivery reconciliation and dispute path.
6. Physical RWA: chain certificates **do not prove physical authenticity/title**;
   require independent attestors, escrow safeguards and no in-place unsafe
   storage migration.
7. Proposed 1 TRO physical-NFT creator reward stays disabled until budget,
   anti-sybil, chain/token transfer and legal accounting controls are approved.

### Lane 3 — Solana/PayBox.sh ops (independent of customer payments)
1. Owner uses [official PayBox.sh OAuth](https://docs.paybox.sh/) from a
   trusted authenticated session. No current credential grant is attested.
2. Reverify Solana wallet **on-device** and network; the historical address
   in the repository is **not** a deposit destination.
3. Prefer free Solana devnet (faucet/ephemeral wallets) and read-only receipt
   checks. PR #574 supports direct SOL native receipts with
   `settlement_recorded:false`, no ownership inference.
4. Before first mainnet micro-funding: exact destination match, owner signer,
   wallet UI approval, gas reserve, finalized hash and reconciled receipt.
5. Separate SC ops: audited devnet program, immutable source/binary hash,
   PDA/account authority tests, upgrade authority, CPI guard and rollback.
   No automatic SOL/mainnet SC signing by xOrus.
6. Jupiter swap live remains blocked by #573 until #570 independent message
   verification and an authorized post-sign settlement ledger.
7. No MultiversX↔Solana $TRO bridge, pool seeding or token sale as side effect.

### Lane 4 — Operations and enterprise readiness
1. Baseline HTTP health, exact public SHA, worker status, DB and backup restore
   probes; differentiate GitHub Pages/Render/OVH runtime. No silent prod DSN.
2. Secrets solely in secure operator-managed server environments; pin versions,
   lockfile and CI, SBOM, incident response and audit logs.
3. Observability: ingestion age, report SLA, auth errors, payments, IPN,
   mint job idempotency, stale cache, indexer divergence, PayBox receipts.
4. Canary/rollback by rail: stop checkout, stop writes, preserve receipts;
   a failed one-rail gate must never start an unrelated rail.
5. Independent review of user-facing terms, refunds, invoice VAT, data retention,
   consent, supplier rights, IP and claims of investment advice.

## Minimal release evidence record

Every GO request requires a reviewed JSON or checklist with:
`feature`, `chain/network`, `commit_sha`, `deployed_sha`,
`tested_at_utc`, `test_run_url`, `evidence_refs`, `source_rights`,
`backend_persistence`, `authorized_actor`, `max_loss`, `rollback`,
`final_verdict`. Never accept an unsigned frontend status as proof.

**Immediate disposition:** maintain **public-read-only / paper** as the
default posture; no fiat checkout, NFT/RWA mainnet writes, Solana trade,
PayBox.sh deposit instruction or paid xOrus analysis is certified by this
document.
