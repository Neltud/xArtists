# xArtists — GO LIVE evidence & Grok ↔ ChatGPT handoff (2026-11-08)

**Scope:** MultiversX-first. **Public browse** may stay live. **Mint, payouts,
escrow release, checkout, royalty/paid plugin and LIA real trading remain
NO-GO until independent on-chain and settlement proof.** This file is not an
operator authorization, signature, or automated deployment approval.

## Verified starting state

| Surface | Observation | Decision |
| --- | --- | --- |
| GitHub Pages public | `build-info.json` served release `0.130.0`, source commit `0ff763f0b4778a1d5baba5dc8b16d046d3ca561d`, `public_route_count=126`, `lia_live_trading=false` | BROWSE GO; not transaction GO |
| GitHub PR #407 | Draft; head `7a64a1706b7189d3ebabbfa05fa71f899b9a2b7f`, 4/4 CI green on inspected head | Mint NO-GO pending real IPFS, upgrade and signer evidence |
| GitHub PR #430 | Draft; head `66386bbef910d36350900564fd7e7b2bca4121e5`, 14/14 CI green on inspected head | RWA on-chain NO-GO; no legacy storage migration proof or audited authority |
| Render xartists-access-api | Render marked deploy `dep-dbo9g1dg1s2s7389b51g` `live`; startup application log on port 10000 | Process starts, but HTTP routes need independent probe |
| Backend external probe | First external probe: HTTP 503 on `/health` and Studio config; **repeat fresh probe: both respond successfully**. `/health` reports `ok:true`, `paybox_checkout_enabled:false`, Stripe live checkout disabled. Studio config reports `enabled:false`, `modelEnabled:false`. Render frontend build stamp agrees on source SHA. | **Transient 503 observed; recovered at repeat**, investigate intermittency/monitor, do not claim persistent outage |
| Direct Grok access | No current xAI/Grok plugin connection discovered | No Grok finding can be claimed until an actual xAI API response is recorded |

Verification can change. The exact target commit, timestamp, and HTTP status must
be rechecked before any public capability statement.

## Grok collaboration: zero write access, manual only

- **ChatGPT**: owns implementation, CI, source-linked incident investigation,
  testing and documents on a separate branch.
- **Grok**: independent *critical reviewer only* of public PR code. It may
  challenge assumptions, propose failing tests, suggest improvements and identify
  conflicts. **It is not the release authority**.
- **Owner/operator + independent human/auditor**: authorize wallet transactions,
  licencing/payment terms, smart-contract upgrades and legal/custodial decisions.

An optional GitHub workflow `grok-manual-readonly-review.yml` dispatches
only when **an operator explicitly chooses** `pulse005` or `rwa` AND
the repository Actions secret `XAI_API_KEY` exists. The script sends only
the allowlisted **public** PR patches under a strict size limit to
`https://api.x.ai/v1/responses` (model `grok-4.7`). It retrieves a
review artifact. It has **read-only** GitHub permissions and does not comment,
merge, deploy, fetch private files, expose keys or send physical-art media.
One manual dispatch can incur xAI API fees; never use a schedule or a
pull_request trigger to call a billed model.

**Configuration** (owner action, no token in chat or commit):
1. Set GitHub repo Actions secret `XAI_API_KEY` via GitHub Settings.
2. Review the selected public file allowlist and third-party data sharing.
3. On GitHub Actions, run `Grok independent mainnet review (manual, read-only)`
   with either `rwa` or `pulse005`.
4. Download the artifact, reproduce findings, and only then write targeted
   fixes. Never interpret a Grok text response as a GO token.

The safety-only CI workflow runs tests without calling xAI. Until a real
xAI API execution returns a report, **Grok has NOT been contacted**.

## Priority release blockers (in order)

1. **Access API intermittent 503:** fresh repeat probe returned healthy HTTP
   responses, while first probe returned 503. Instrument periodic read-only
   health and Studio-config checks, service role, cold-start/restarts and
   exact timestamps. **Do not claim ongoing outage or perfect SLA.** The
   recovered `/health` confirms Paybox checkout disabled and Stripe live
   checkout disabled; Studio IPFS/GLB uploads remain off.
2. **Studio IPFS/GLB:** confirm actual Render service database and migrations,
   signed artist wallet session, default-off GLB gate, same-wallet pinned
   poster, exact-byte SHA-256 from 2 independent gateways, pin receipts,
   recovery retention and CIDs. The N. TUDURI V12 geometry remains an
   interpreted sculpture, not a calibrated scan; photo slideshow/cover may
   be public without certifying geometry.
3. **Genesis Pulse #005:** exact rights-cleared four files, correct on-chain
   collection/roles, independent mainnet codehash/upgrade simulation,
   wallet-owner approval of the exact transaction, NFT nonce/recipient and
   finality verification. No automatic owner-signed transaction.
4. **RWA:** investigate whether any v1 contract with locked EGLD exists.
   If not, audit and separately authorize a new v2. If legacy storage
   exists, upgrade is NO-GO because the `Escrow` binary layout changed.
   RustVM green covers new-instance simulated transfers, not historic funds
   or physical legal title. Server admin proof has no privileged HTTP route
   and no multisig authority.
5. **Commercial wallet/payment/DAO:** entitlement/refund/settlement evidence,
   on-chain governance and independent contract reads. Keep fiat,
   bridge, additional chains and LIA live trading deferred under current
   MultiversX-first scope.

## GO/NO-GO decision rule

A production capability is GO only after: exact release SHA and CI green;
public backend path operational; user signed/authorized operation; chain ID 1
and codehash/collection role readback; real successful transaction receipt with
nonce, recipient and block; independent delivery/settlement readback and
security/rights review. Missing proof is always **NO-GO**, not `pending but live`.

**Do not flip any of**
`paybox_checkout_enabled`, `mint_live_enabled`,
`STUDIO_GLB_UPLOAD_ENABLED`, `CREATOR_MEDIA_UPLOAD_ENABLED` or
`LIA_LIVE_TRADING` from this report.

## Reproducible handoff

```
GROK ↔ CHATGPT — 2026-11-08 Europe/Paris
Repo Neltud/xArtists
Released main: 0ff763f0b4778a1d5baba5dc8b16d046d3ca561d
PR #407: 7a64a1706b7189d3ebabbfa05fa71f899b9a2b7f — draft — 4/4 CI green
PR #430: 66386bbef910d36350900564fd7e7b2bca4121e5 — draft — 14/14 CI green
Public Pages: version 0.130.0, browse only
Render: deploy live; initial probe 503, fresh health/Studio probes OK — investigate intermittent availability
Your assignment: challenge both PRs, prioritize reproducible P0 test failures;
do not modify or merge any of their files without an assigned handoff.
No keys, personal data, on-chain tx, payment or live trading authorization.
Return: source path + line, exact failing precondition, exploit scenario,
reproduction command and evidence, uncertainty, recommended fix.
```
