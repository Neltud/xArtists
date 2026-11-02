# xArtists — Module Live Matrix (Sprint GO · 2026-11-02 20:33 CET)

**Tip:** `eee78a85` · **0.129.1**  
**Doctrine:** produits & modules **fonctionnels** en lecture / signal / UX.  
**LIA ne trade pas** (`LIA_LIVE_TRADING=0`) — **signaux paper/shadow**.

## Produits commerciaux

| Produit | Surface | Live UX | Paiement | NFT mint |
|---------|---------|---------|----------|----------|
| **Pulse** 110€ | `/packs/pulse` | ✅ Pages 200 | PayBox fail-closed | dry_run · live gated |
| **Yield** 75€ | `/packs/yield` | ✅ | idem | idem |
| **Sentinel** 50€ | `/packs/sentinel` | ✅ 200 | idem | idem |
| **My Packs** | hub / on-chain | ✅ | — | lit collections |
| **$TRO sale** | `/tro/sale` · `/finance/tro/sale` | ✅ 200 | — | bridge **OFF** |
| **TCA Membership** | Whop | ⏳ `prod_` | Whop | **no Genesis** |
| **Playlist** | modal | ✅ | — | — |
| **Museum / Louvre** | modules | ✅ | — | frames |
| **Studio media** | creator upload | ✅ code | — | Pinata **OFF** |
| **Physical RWA** | `/rwa` Shopify | ✅ code | — | fulfillment **OFF** |

## Modules expérience

| Domaine | Live |
|---------|------|
| Command Center / Wall | ✅ UI |
| LIA Hub / signals / shadow | ✅ JSON + `/v1/signals/daily` |
| Intelligence agents | ✅ |
| Art World Map | ✅ |
| Genesis / Vellum | ✅ paper |
| $TRO tokenomics + sale portal | ✅ |
| Guardian banners | ✅ |
| Access API (PayBox, mint, studio, physical, TRO status) | ✅ code · flags off |

## LIA

| Capacité | État |
|----------|------|
| Wallet snapshot · shadow PnL · aura | ✅ |
| Daily signal | ✅ |
| **Execute swap live** | ❌ |

## Mint / Pay

| Étape | État |
|-------|------|
| Quote · PayBox · IPN RSA · server_confirmed | ✅ |
| Dispatch Actions | ✅ dry_run default |
| Mainnet buyPack | 🔒 humain |

## DoD

- [x] Routes packs + museum + command + playlist + TRO sale
- [x] JSON status/signals sur Pages
- [x] API health flags (mint, signals, tro off, studio/physical off)
- [x] TS strict + npm ci access-api
- [ ] access-api prod mint dry_run=1 **confirmé ops**
- [ ] Premier mint micro humain
- [ ] S1/S2 commercial

Voir aussi: `docs/SPRINT_GO_AUDIT_2026-11-02.md`
