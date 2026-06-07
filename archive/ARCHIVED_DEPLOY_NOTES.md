# Archived deploy notes

This file consolidates historical deploy triggers/logs that were present in the repository for debugging.

---

Deploy triggered by user @Neltud on 2026-06-05

Action: Push main and start CI/CD (build & deploy to GitHub Pages).

Notes:
- On-chain price & APY services added (src/services/onchain.ts)
- MultiversX SDK integration added (src/services/multiversx.ts)
- Wallet and staking hooks updated (src/hooks)
- TRO dashboard wired for on-chain data (src/features/TRODashboard.tsx)

---

Commit: chore: push onchain integration, MultiversX SDK, price/onchain services, wallet & staking hooks, TRO dashboard updates

Commit: fix(audit): browser-safe base64 decoding, import React hooks, robust on-chain parsing and error handling

(End of archived notes)
