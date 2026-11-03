# xArtists — 360° public launch triage
**As of:** 2026-11-03. **Operator checklist; not public product copy.**
**Scope:** public discovery and read-only telemetry, NOT commercial activation.

## Verified evidence / current truth

- GitHub Pages: https://neltud.github.io/xArtists/ (the project has a subpath base; every canonical direct route requires its own build alias and live HTTP check).
- LIA public path: /intelligence/lia, alias /lia. 2D default and explicit 3D opt-in in this PR.
- Public LIA aggregate snapshot at /data/lia_status.json: ts=2026-11-03T11:44:44Z, paper=true, LIA_LIVE_TRADING=0.
- Public LIA hub mirror at /data/lia_hub_status.json: ts=2026-10-07T15:40:00Z, obsolete. Do not display it as fresh or let a client-side clock reset its age. The mirror's operator note contains an internal docs path; do not expose that note on the public dashboard.
- Public "live tape" and the earlier LIA 3D view display LIVE wording alongside simulated data. Public-first view must describe data-source freshness, distinguish public market price data from paper decisions, and defer advanced diagnostics.
- PR #344 separately implements direct Marketplace/Auctions access and mobile dock fix; coordinate review rather than duplicate its touched files.
- Marketplace buy/list and auction bids: **not certified for commercial launch**. The marketplace codehash and backend flags must be verified before any write.
- PR #341: xartists.art currently NXDOMAIN; hello@xartists.art cannot be advertised as an operational mailbox.
- #281 + #328: payment-to-mint, reconciliation, refund and claim replay assurances are not complete. Never infer NFT delivery from paid IPN or dispatcher acceptance.
- No user wallet signing, on-chain transaction, shipping order, bridge operation or production flag toggle was performed for this triage.

## Launch decision matrix

| Surface | Tonight's potential GO | Must not be advertised |
| --- | --- | --- |
| Home / Maison / public museum | GO after responsive, asset and route checks | Minted provenance for unverified artwork |
| Marketplace / Auctions / RWA | GO for discovery and editorial previews once PR #344 checks pass | Real purchases, active bidding, escrow, delivery |
| Studio | GO for local file selection and preview (JPG/PNG/WebP/MP4) | IPFS publication or NFT mint without receipt |
| Agent packs / Whop | GO for clear public information and distinct one-time vs subscription products | Post-payment NFT delivery without independently proven receipt |
| LIA Control Room | GO for timestamped, read-only paper signals only | Real-time trading, realized P&L, autonomous execution |
| Token / Solana bridge | Information only, separated from checkout | Any functional bridge or sale not independently deployed and secured |
| Contact/lead capture | Official public channels, subject to privacy safeguards | hello@xartists.art until independent receiving/reply tests |
| Render / Neon / mint jobs | Read-only status and synthetic sandbox tests | GO-live toggle or live mint while #281 / #328 remain open |

## Public content rules

1. First viewport on each page: purpose, primary action, one truthful availability/status line.
2. Remove operator notes, environment variable names, debug logs, unverified "LIVE"/"MAINNET LIVE" claims from public first-level content. Keep diagnostics behind explicit disclosure and redact any sensitive data.
3. Keep all simulated figures labeled "paper/shadow" adjacent to the figure; never use simulated performance as marketing ROI.
4. Provide honest empty states, not synthetic listings, prices, bids, wallet receipts, NFT supply or provenance.
5. Consistent naming and language: Museum, Marketplace, Auctions, Studio, LIA Control Room, Agents, My assets. Use native labels rather than internal routes/version names.
6. Mobile 360–430 px: one-row nav without clipping, safe-area bottom padding, visible CTAs and focus/keyboard routes; desktop 1280–1440 px: restrained sidebar, 1 main task per view, no forced WebGL.
7. Non-core/lab features remain reachable only where supported and must be clearly marked experimental; never silently promote into public merchandising.
8. Product descriptions must make independent rights explicit: physical title, provenance certificate and NFT/token rights are not interchangeable.

## End-to-end release gate (record evidence per row)

### Public experience
- [ ] Merge / deploy PR #344 only when CI is green and live Pages route aliases return HTTP 200 with correct asset base.
- [ ] Complete CI for LIA public-first PR and manually verify both sizes on a real device; confirm lazy 3D assets are not loaded on initial display.
- [ ] On each core route: home, museum, market, auction, RWA, studio, agents, LIA, guide, offres, legal: direct GET, refresh, back/forward, link from nav, social/SEO title, 404 handling, latency and mobile viewport.
- [ ] All first-screen public status copy verified against API and network; no false "LIVE" badges on paper results.
- [ ] Keyboard-only, reduced motion, 200% zoom, contrast and touch target QA; check sticky LIA Brief vs mobile dock.
- [ ] Independently capture evidence (screenshots & steps) for a no-wallet visitor journey Home -> Museum -> Marketplace -> Auctions -> Studio -> LIA.

### Real transaction chains — explicitly NO-GO until proven
- [ ] S1 controlled fiat payment, signed IPN + idempotency, concurrency/replay tests, compensation & refund with verified records.
- [ ] NFT mint uses atomic SC design, chain/replay protections & independent review; verify transaction hash, token identifier, recipient, ownership and delivery BEFORE marking delivered_at.
- [ ] End-to-end failed payment, stalled mint, restarted job, delivery retry, wrong chain/wallet and refund; no duplicate NFT.
- [ ] Real artist-upload storage rights/licences, malware scan and IPFS pinning; upload should not claim minted until signed chain receipt.
- [ ] Auction settlement, physical custody, shipping, buyer-protection terms, NFT dual-transfer protection & regulatory/legal review before enabling bids.
- [ ] No public commerce release without security/finance operator signoff, support mailbox and monitoring.

## Catawiki feasibility (external channel only)

Catawiki accepts submissions of eligible special physical objects/art, subject to expert review and seller identity checks. An external listing is **not** a xArtists smart-contract auction. No supported connected Catawiki integration was found in current plugin directory. Begin with a manual curated-pilot flow: artwork rights, inventory uniqueness, appraisal/evidence, high-quality photos, seller KYC and terms, shipping plan, expert approval, publish link only after acceptance, order/fulfilment and invoice reconciliation. Check Catawiki fees, VAT, professional status and category rules before pricing. Prevent unsynchronized simultaneous sale of the same unique physical work. Do not assert NFT acceptance or automatic NFT transfer.

## Deployment evidence
- [ ] GitHub CI result + SHA
- [ ] GitHub Pages live URL, 200/asset proof and source SHA
- [ ] API /health fresh and production flag snapshot
- [ ] rollback commit + operator named
- [ ] commercial decision separately documented: GO discovery != GO checkout != GO mint != GO auction != GO trading
