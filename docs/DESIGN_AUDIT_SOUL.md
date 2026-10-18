# Design audit — xArtists × soul.io

**Date :** 2026-10-18  
**Statut :** P0–P3 livrés · P4 partiel · P5 en cours

---

## Livré

| Phase | Statut | Détail |
|-------|--------|--------|
| **P0** Tokens CSS | ✅ | `styles/soul-tokens.css` + import `index.css` |
| **P1** Copy FR/EN core | ✅ | `dictionariesCore.ts` protocol-grade + packs |
| **P2** Home stats + hero | ✅ | `Dashboard.tsx` |
| **P3** Sale + Agents i18n | ✅ | `SalePage.tsx`, `Agents.tsx`, Header |
| **P4** ES/DE packs | ✅ partiel | Nav/home/packs ES/DE/ZH |
| **P5** CC / Market / Museum | ✅ chrome | CommandCenter, Marketplace, Museum, Footer |

### Pages protocol-grade
- Home, Packs, Sale, Header, BottomNav (tokens), Command Center, Marketplace, Museum, Footer

### Design system
- Fond `#0a0a0f`, surfaces, boutons mono, cards sans glow excessif
- Inter + DM Sans, stats strip, hero, disclaimers paper / non-custodial

---

## Suite optionnelle
- LIA / TCA / Wallet / Staking — même chrome `xa-*`
- ES/DE checkout + legal complets
- Retirer progressivement Orbitron / scanlines des sous-composants CC

---

## Non-objectifs (inchangés)
- Pas de copie branding soul.io
- Packs Pulse / Yield / Sentinel conservés
- Pas de promesse APY
