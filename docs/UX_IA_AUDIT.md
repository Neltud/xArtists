# UX / IA Audit — xArtists front (2026-11-01)

## Diagnostic

| Signal | Mesure |
|--------|--------|
| Modules routés | **36** (`experience/modules.ts`) |
| Pages orphelines | **22** (non référencées dans modules) |
| Cartes produit parallèles | `config/product.ts` + modules + BottomNav |
| Groupes | explore · create · intelligence · finance · workspace |

**Symptôme** : navigation et directory saturés — surfaces lab au même niveau que le cœur commercial.

## Périmètre soft-launch

1. Musée (`/museum`)
2. Packs IA (`/agents`)
3. Marché (`/market`)
4. LIA Hub paper (`/lia`)
5. Essentials : Studio, Wallet, My Packs, App, Legal, Staking, Portfolio

Reste = **lab** (routes OK, masqué en browse sauf `?lab=1`).

## Correctifs (cette PR)

- `experience/softLaunch.ts`
- `Pages.tsx` — Group / Directory / sidebar filtrés core
- `BottomNav` — 5 hubs
- `config/product.ts` — CORE aligné

## Prochaines passes

1. Hero home : CTA Packs + Musée prioritaires
2. Fusion pages orphelines
3. Header desktop raccourcis core
4. Intent bar limitée au core
5. Archive `_legacy`

## Doctrine

Paper LIA · No-Go commercial jusqu’à micro-preuve + S2 · Slot → `/`.
