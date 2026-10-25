---
hidden: true
noIndex: true
---

# Build & smoke test (production)

**Date:** 2026-10-12\
**Result:** `vite build` **Exit 0** (\~56s)

## Fixes applied for green build

1. `i18n/dictionaries.ts` — export `DICTS` alias for `I18nContext`
2. `pages/LiaPage.tsx` — imports corrected to `lia/protocolProfile`, `lia/priceTick`, `lia/shadowExport`, `lia/decisionCycle`
3. `lib/digitalTwin/browserApprox.ts` + `mintIntent.ts` — re-exports for PhysicalNftCertifier

## Bundle notes

* LiaPage chunk present
* TcaGatePage + TcaClassroom chunks present
* three.module + Lia control room loadable via LiaPage

## Manual smoke (GitHub Pages)

| Route  | Check                                              |
| ------ | -------------------------------------------------- |
| `/lia` | Holo screens open modal; PDF download non-blocking |
| `/tca` | NONE / SAMPLE / FULL gate → Module 1               |
| `/`    | Pitch toggle hides debug overlays                  |

## Known non-blocking

* `tsc --noEmit` still reports legacy errors outside this release scope (sdk-dapp types, placeSculptures, etc.)
* Vite may warn on lottie `eval` and externalized `crypto` (deps)
