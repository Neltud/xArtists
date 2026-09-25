# Slot Casino (MultiversX)

Smart contract **public** pour le slot 3×3 xArtists.

## Économie

| Paramètre | Défaut recommandé | Rôle |
|-----------|-------------------|------|
| `progressive_contrib_bps` | 2500 (25 %) | Part de chaque mise → cagnotte |
| `house_rake_bps` | 1500 (15 %) | Rake sur gains table (ligne / diag / paire) |
| `min_bet` | 5×10^16 (0.05 EGLD) ou 1×10^6 USDC | Mise minimum |

### Outcomes (roll 0–9999)

| Outcome | Plage | Payout |
|---------|-------|--------|
| **Grand** | 0–7 (~0.08 %) | Toute la cagnotte progressive + 5 % de la mise |
| Line3 | 8–207 | 8× mise après rake |
| Diagonal | 208–407 | 7× mise après rake |
| Pair | 408–1007 | 1.2× mise après rake |
| Lose | reste | 0 |

Le **Grand** correspond au jackpot 9/9 côté front (mapping UX).

## Endpoints

### Joueurs
- `spinEgld()` payable EGLD
- `spinEsdt()` payable ESDT whitelisté (USDC…)

### Owner
- `setPaused`, `setProgressiveContribBps`, `setHouseRakeBps`, `setMinBet`
- `setPaymentTokenAllowed(token, bool)`
- `fundProgressiveEgld` / `fundProgressiveEsdt`
- `claimHouseEgld` / `claimHouseEsdt` — ne touche **pas** à la cagnotte
- ownership 2-step

### Views
- `getProgressiveEgld`, `getProgressiveEsdt`, `getSpinCount`, `getGrandCount`, `getMinBet`, `isPaused`, …

## Build

```bash
cd contracts/slot-casino
# via mxpy / scripts/build_scs_isolated.sh quand branché
```

## Deploy (mainnet — gate humaine)

1. Build WASM
2. Deploy avec PEM **owner ops** (jamais en git)
3. `setPaymentTokenAllowed` pour USDC mainnet
4. `fundProgressiveEgld` seed initial
5. Adresse → `data/contracts.json` + `VITE_SLOT_CASINO_ADDRESS`
6. Front: activer spins on-chain seulement si codeHash vérifié

## Sécurité

- Pause + owner ACL + 2-step ownership
- Progressive protégée des `claimHouse*`
- Cap payout ≤ balance (et ≤ balance − progressive pour gains table)
- RNG = `block_random_seed` + tx hash (pas un VRF oracle) — **documenter** aux joueurs
- Audit externe recommandé avant TVL réelle

## Statut

**Code source prêt · non déployé · SC flags front OFF jusqu’à GO_LIVE.**
