# Plan produit / LIA — statut (1 août 2026)

**PEM = Vellum uniquement.** GitHub deploy-scs est optionnel.

## Vellum nodes live

| Étape | Code | Statut |
|-------|------|--------|
| gate → open_trailing → tick → close | `lia/vellum/live_cycle.py` | ✅ |
| append_trade | `nodes_trailing_cycle.py` + `data/lia_trades.json` | ✅ |
| redistribute TRO no-hold | policy + executor hook dans live_cycle | 🟡 appeler `redistribute_tro` live |
| confirmation poll adaptatif | `lia/executor/universal_executor.py` | ✅ |
| Doc resume | `docs/VELLUM_RESUME_LIVE.md` | ✅ |

**Action Vellum :** coller `run_cycle(...)` après le dernier publish ; push JSON `data/*` vers GitHub.

## Dashboard

| Item | Statut |
|------|--------|
| Liste trades LIA | ✅ `Trading.tsx` lit `lia_trades.json` |
| État trailing | ✅ `lia_trailing_state.json` |
| Hatom réel | ✅ service `hatomService.ts` + fallback `hatom_lia.json` |
| TRO fallback | ✅ `priceService.ts` lit aussi `config.json` + `tro_pool.json` |

## $TRO

| Item | Statut |
|------|--------|
| Supply ~476 223 fallback | ✅ `priceService.ts` |
| Pool OneDex + DexScreener | ✅ config + TroPage / Trading links |
| Prix MVX API | ✅ economics + token |

## Fiat / PWA / P2

| Item | Statut |
|------|--------|
| MoonPay button | ✅ composant ; à coller hero Marketplace au prochain patch UI |
| PWA install | ✅ banner + SW ; icons = logo existant |
| GreenSmoke top 10 | 🟡 `data/greensmoke_top.json` seed |
| Perf fee 15% | doc LEGAL / commissions |
| Video Shorts NFT | design only |
| E2E CI | workflow présent |
| Audit SC | avant TVL |

## Prochaine action humaine (Vellum)

1. Node Python `from lia.vellum.live_cycle import run_cycle`
2. Secrets PEM + `LIA_LIVE_TRADING`
3. Après run : push `data/lia_trades.json` + `lia_trailing_state.json`
4. Relancer **Deploy xArtists Exclusive** pour publier le nouveau Trading UI

## P0 restant clair

1. Déployer `agents-marketplace` mainnet puis renseigner `data/contracts.json`
2. Brancher UI list/buy/execute agent actions côté `/agents`
3. Étendre Playwright wallet mock + marketplace + DAO
4. Ajouter indicateurs finality/shard UI après disponibilité Supernova mainnet
