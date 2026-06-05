# xArtists — LIA v5 (Clean Main)

**MultiversX × Bitcoin × AI Agent**

## Current Status (Cleaned June 2026)

### What works:
- Dashboard with real prices (EGLD + TRO-94c925)
- Bitcoin Layer 2 (Bridge mock + Lightning + X402 + L402)
- Hatom positions
- LP Pools TRO
- Tip / Pourboires page
- Wallet Connect
- All pages properly routed

### Deployment Method:
- Manual build + push to `main`
- GitHub Pages deploys from `main` → `/docs`

## How to publish
```bash
cd apps/frontend
npm run build
cd ..
git add .
git commit -m "deploy"
git push origin main
```

Site: https://neltud.github.io/xArtists
