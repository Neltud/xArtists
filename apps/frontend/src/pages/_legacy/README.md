# Legacy pages (Chantier 3)

Orphan cleanup on 2026-10-06 deleted files that **canonical routes still re-exported**.
**Restored 2026-10-07** (required for Pages build + App.tsx):

- `Agents.tsx` (route `/agents` via AgentsPage)
- `MyPacks.tsx` (route `/my-packs` via MyPacksPage)
- `Tip.tsx` (route `/tip` via TipPage)

Do **not** delete these three without rewriting the `*Page.tsx` re-exports and the `static.yml` Agents grep.
