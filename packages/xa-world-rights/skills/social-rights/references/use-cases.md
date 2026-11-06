# Acceptance cases and examples

1. Creator licences own X illustration to a brand for 90 days in France on owned channels. Keep source post/account/copyright and platform revenue with creator. Draft fixed EUR price; usage royalty basis/reporting explicit. Paid ads and AI training require separate grants.
2. YouTube filmmaker offers a 30-second clip with licensed commercial music. Block external sale until music/performer scope supports buyer use; offer a cleared silent master. Source URL and OAuth do not clear music.
3. Instagram creator opts into proposals. Prepare a nonpublic listing preview. No listing or offer acceptance until exact creator-approved version and current policy review. Refuse to enroll other creators from public profiles.
4. TikTok clip offered in timed crypto auction. Fix currency/network/base units, reserve, increment, UTC close and late-bid rules. No bids or checkout executed. Block until EEA policy, full rights and auction contract reviewed.
5. One video cross-posted on all four platforms. Reuse one asset ID; reserve exclusive rights in a central transactional registry. Two simultaneous exclusive buyers must not both succeed. Offline validator cannot prove registry consistency.
6. Creator requests unlimited ownership transfer while keeping 8% revenue royalties. Distinguish assignment from licence, enumerate economic rights and royalty basis, disclose existing licences; require legal review. Do not claim perpetual unrestricted copyright transfer from an NFT.
7. Forged wallet proof, tampered localStorage or SAMPLE JWT: no account/copyright proof. Wallet signing capability alone does not prove authorship. Never promote simulated controlProven to production evidence.
8. Browser success redirect or duplicate PSP webhook: no activation from browser; server signatures, amount/order/currency binding and idempotency required. Wrong-network crypto deposit or unconfirmed Lightning invoice is unpaid.
9. Paid file delivered then limited term expires: revoke server access under contract, record expiry; do not promise deletion of copies outside control. Seller deleting source post is not equivalent to contract cancellation.
10. Resale marketplace ignores NFT royalty flag: no guaranteed royalty payout; contractual enforcement/reporting remains separate. Split recipients and platform monetization must not be conflated.

## Implementation backlog — no deployment in this release

P0: identity/rights evidence and versioned consent; licence/royalty contract review; central exclusivity reservations with concurrency tests.
P1: authorized platform adapters and private original storage; fail-closed financial adapters, authenticated webhooks and independent delivery receipts; contract evidence storage.
P2: auction engine, offers workflow, reporting/audits, controlled buyer access and disputes. Test time-bound reservations, ties, cancellation, revocation, replay and refunds before live use.

The bundled self-tests check draft blockers and precision; they do NOT test these services, cryptography, provider settlement or legal validity.
