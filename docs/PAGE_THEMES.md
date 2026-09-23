# Page themes — unique background per route

Each dApp route applies a distinct ambient theme (gradient wash + Tuduri oil strip + accent orbs).

## Files

| File | Role |
|------|------|
| `apps/frontend/src/config/pageThemes.ts` | Theme map + `themeIdFromPath()` |
| `apps/frontend/src/components/ArtAtelierBackdrop.tsx` | Applies CSS vars + panel rotation on route change |
| `apps/frontend/src/atelier.css` | Wash, orbs, per-theme strip tweaks |

## Themes

| Route prefix | Theme id | Accent feel |
|--------------|----------|-------------|
| `/` | home | violet / cyan |
| `/trading` | trading | emerald desk |
| `/market` | market | sky analysis |
| `/marketplace` | marketplace | pink market |
| `/museum` | museum | ochre atelier |
| `/studio` | studio | vermillion oil |
| `/agents`, `/my-packs` | agents | purple packs |
| `/tours` | tours | teal journey |
| `/dao` | dao | indigo vote |
| `/wallet`, `/tip` | wallet | green custody |
| `/portfolio` | portfolio | blue book |
| `/staking`, `/lp` | staking | gold lock |
| `/tro` | tro | purple token |
| `/burnify` | burnify | red burn |
| `/hatom` | hatom | teal defi |
| `/sale` | sale | amber launch |
| `/demo`, `/go-live` | demo | cyan walkthrough |
| `/sim` | sim | indigo lab |
| `/ads` | ads | orange ads |
| `/legal` | legal | slate muted |
| `/entity`, `/sitemap` | entity | cyan map |

## How it works

1. `useLocation()` → `getPageTheme(pathname)`
2. Sets `--page-a/b/c/glow` + `--page-accent` on `:root`
3. `body[data-page-theme="…"]` for optional future CSS
4. Rotates which of the 6 NFTUDURI thumbs appear in the 2×2 strip

## Publish

Copy the three files into the repo, commit, push `main` → GitHub Pages rebuild.

No change required in `App.tsx` — backdrop is already mounted globally.
