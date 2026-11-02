# xArtists — Module Live Matrix (Sprint 3 · 2026-11-02)

**Doctrine:** tous les **produits & modules** sont **fonctionnels en lecture / signal / UX**.  
**LIA ne trade pas** (`LIA_LIVE_TRADING=0`) — elle **publie des signaux** (paper/shadow).

## Produits commerciaux

| Produit | Surface | Live UX | Paiement | NFT mint |
|---------|---------|---------|----------|----------|
| **Pulse** 110€ | `/packs/pulse` · shelf · 3D card | ✅ | PayBox fail-closed | dry_run default; live gates |
| **Yield** 75€ | `/packs/yield` | ✅ | idem | idem |
| **Sentinel** 50€ | `/packs/sentinel` | ✅ | idem | idem |
| **My Packs** | hub packs / on-chain match | ✅ | — | lit NFT collections |
| **TCA Membership** | Whop (externe) | ⏳ prod_ | Whop | **no Genesis** |
| **Playlist** | modal global | ✅ | — | — |
| **Museum / Louvre** | modules museum | ✅ | — | frames collections |

## Modules expérience (Shell)

| Domaine | Rôle | Live |
|---------|------|------|
| Command Center / Wall | NLP intent surface | ✅ UI |
| LIA Hub / Cockpit | status · shadow · aura | ✅ data JSON |
| Signals (daily / fusion / ticker) | lecture seule | ✅ |
| Intelligence agents | pack landings | ✅ |
| Art World Map | cartographie | ✅ |
| Genesis / Vellum bridge | statut machine | ✅ paper |
| $TRO tokenomics feeds | lecture | ✅ JSON |
| Guardian / circuit banners | statut | ✅ |
| Access API | JWT · SIWX · PayBox · quotes · mint dispatch | ✅ (mint dry) |

## LIA — signaux sans trading

```
paper: true
LIA_LIVE_TRADING: 0
sources:
  - public/data/lia_status.json
  - public/data/signals/daily_signal.json
  - public/data/lia_signal_fusion.json
  - public/data/signal_ticker.json
API (optionnel):
  GET /v1/signals/daily
```

| Capacité | État |
|----------|------|
| Snapshot wallet LIA | ✅ |
| Shadow PnL / fills | ✅ paper |
| Aura / regime | ✅ |
| Daily editorial signal | ✅ |
| Intent feed | ✅ JSON |
| **Execute swap live** | ❌ allowlist + flag off |

## Mint / Pay path

| Étape | État |
|-------|------|
| Quote Rule1 | ✅ |
| PayBox session + IPN RSA | ✅ |
| `server_confirmed` | ✅ |
| Dispatch Actions | ✅ dry_run default |
| Mainnet buyPack | 🔒 gates humains |

## Non-négociable Sprint 3

1. `VITE_LIA_LIVE_TRADING=0` / `LIA_LIVE_TRADING≠1`
2. Mint live seulement avec PEM + confirm + buyer
3. Signaux = **informatifs**, pas d’ordre auto
4. Whop ≠ Genesis NFT

## Definition of Done « all modules live »

- [x] Routes packs + museum + command + playlist montent
- [x] JSON status/signals servis depuis Pages
- [x] API health expose packs + mint flags
- [ ] access-api prod avec mint dry_run=1 déployé
- [ ] Premier mint micro humain (hors DoD lecture)
- [ ] S1/S2 commercial (hors DoD signaux)
