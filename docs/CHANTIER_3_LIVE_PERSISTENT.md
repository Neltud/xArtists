# Chantier 3 — Live persistent + nettoyage

## Done this pass

- `DailySignalWidget` in Command Center hub (sous le header)
- `signAccessMessage.ts` → xPortal WC `signMessage` for SIWX
- `tcaVerifyClient` uses xPortal sign before verify-access

## Routes canoniques

Only what is in `App.tsx` + HashRouter `#/…`.

## Orphans to archive next

AdminPage, BitcoinLayer2, BridgeFeesDashboard, DigitalTwinPage, MuseumLabPage,
RwaCatalogPage, SoulTestnetPage, duplicate Marketplace/MyPacks/Wallet/Gallery/DAO

Move to `apps/frontend/src/pages/_legacy/` or delete after confirming no deep links.

## Live persistent checklist

- [x] Signal journalier visible CC
- [ ] SW/cache hard-refresh note on deploy
- [ ] Purge orphan pages
- [ ] Dashboard entry ATC/TCA one clear CTA
