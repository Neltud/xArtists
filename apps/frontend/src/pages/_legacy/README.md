# Legacy pages (Chantier 3)

These routes were **not** registered in `App.tsx`. Removed from `src/pages/` to shrink the active surface.

Recover from git history if needed:

```bash
git log --all -- apps/frontend/src/pages/ArtistStudio.tsx
git show HEAD~N:apps/frontend/src/pages/ArtistStudio.tsx
```

## Archived (2026-10-06)

- AdminPage.tsx
- Agents.tsx
- ArtistStudio.tsx
- BitcoinLayer2.tsx
- BridgeFeesDashboard.tsx
- DAO.tsx
- DigitalTwinPage.tsx
- ExplainCards.tsx
- Gallery.tsx
- HistoryPage.tsx
- HolderRoomPage.tsx
- LandingHero.tsx
- LiaPerformancePage.tsx
- MarketPage.tsx
- Marketplace.tsx
- MuseumLabPage.tsx
- MyPacks.tsx
- Portfolio.tsx
- RwaCatalogPage.tsx
- SoulTestnetPage.tsx
- Tip.tsx
- Trading.tsx
- VenueAccountPage.tsx
- VoyageAgentPage.tsx
- Wallet.tsx

Canonical pages remain the ones imported by `App.tsx` (e.g. MarketplacePage, MyPacksPage, WalletPage).
