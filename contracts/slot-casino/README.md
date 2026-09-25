# Slot Casino (MultiversX) — Provably Fair

Smart contract public pour le slot 3×3 xArtists.

See **[PROVABLY_FAIR.md](./PROVABLY_FAIR.md)** for RNG verification.

## Flow joueur

1. `lockSpinEgld(client_seed)` ou `lockSpinEsdt(client_seed)` — mise en escrow
2. Attendre `resolve_delay_blocks` (défaut **2**)
3. `resolveSpin(spin_id)` — settlement + payout
4. Ou `refundSpin(spin_id)` après timeout

## Économie

| Paramètre | Défaut | Rôle |
|-----------|--------|------|
| `progressive_contrib_bps` | 2500 | 25 % mise → pot (au resolve) |
| `house_rake_bps` | 1500 | 15 % rake gains table |
| `min_bet` | 0.05 EGLD raw | Minimum |
| `resolve_delay_blocks` | 2 | Anti same-block /
| `timeout_blocks` | 100 | Refund si non résolu |

## Endpoints

**Play:** `lockSpinEgld`, `lockSpinEsdt`, `resolveSpin`, `refundSpin`  
**Owner:** pause, BPS, delay, timeout, whitelist token, fund/claim progressive house  
**Views:** progressive, pending spin, counts

## Sécurité RNG

- Commit client seed → delay → keccak(seed ∥ blocks ∥ random_seed ∥ player)
- Resolve public (pas de block shopping joueur)
- CEI, pause, progressive lock, pending cap, timeout refund

## Statut

**Source ready · not deployed · front paper until GO_LIVE + address + codeHash.**
