# ACTIVE_CONTEXT — xArtists / xOrus
## Sonde et posture — 28 novembre 2026 (~05:40 UTC)

- **Discovery GO** : Pages **0.139.0** sert `source_sha=2d4138cb45fbcfb8a50afa1da2d6dd391837d47f` (build `2026-11-27T20:08:27Z`, 140 routes, `lia_live_trading=false`). Routes publiques `/`, `/museum/`, `/marketplace/` HTTP 200.
- **API Render** : `ok=true`, SHA **`8b6fae84`** (retard vs Pages). Flags commerce tous fermés : `paybox_checkout_enabled=false`, `mint_live_enabled=false`, `mint_dry_run=true`, `auction_enabled=false`, `studio_media_upload=off`, `lia_live_trading=0`.
- **Commerce** : **NO-GO**. PayBox configuré en prod ≠ encaissement. Aucun paiement réel + My Packs NFT prouvé.
- **Studio** : schéma / table_ready encore absents côté store public ; PR #649 (Neon isolé) sur main ; PR #651 (routing API dédiée) et #648 (UX public-first) ouvertes.
- **xOrus** : paper / shadow / ABSTAIN. Terminal local simulation. Agents d’observation mainnet MultiversX + Solana (Neon Free). Aucun wallet lié, aucune exécution live.
- **Bloquants humains (ordre strict)** :
  1. **#506** — Allowlist Reown Cloud (`https://xartists.art` + `https://www.xartists.art`) + smoke QR physique xPortal (Android/iOS). Aucune signature d’achat.
  2. **#428** — Cycle list → buy mainnet (2 wallets, 2 hashes Explorer, possession acheteur).
  3. **#341** — Preuve réception `hello@xartists.art`.
  4. Studio migrations après backup DB (004→005) une fois store isolé stable.
- **Interdit** : lever `LIA_LIVE_TRADING`, `paybox_checkout_enabled`, mint public, assisted POST, annonce de commerce ouvert.
- **Code 27 nov déjà sur main** : marketplace listing direct wallet + diagnostics vendeur (#645), Studio Neon isolé + sessions (#649), architecture Global Pay multidevise planning-only (#647), custody withdraw safety source (#644 encore ouverte), UX Studio/Wallet/Agents compact (#641), observations xOrus (#637).

Preuve live : `https://xartists.art/build-info.json` · health `https://xartists-access-api.onrender.com/health`.

## Suites logiques immédiates (chef d’orchestre)

| Priorité | Action | Owner | Gate |
|----------|--------|-------|------|
| P0-ops | Allowlist Reown + smoke physique | Opérateur | #506 |
| P0-code | Merge #648 (UX Studio/xOrus public-first) si CI verte | Grok/CI | tests + Pages |
| P0-code | Merge #651 après coordination #648 | Grok | VITE_STUDIO_API_BASE non activée par défaut |
| P0-code | #644 custody withdrawals — attester VM tests puis merge | Grok + owner SC | aucun upgrade mainnet auto |
| P1 | Release-please 0.140.0 (#591) une fois tip stable | Bot | après merges UX |
| P1 | Dependabot WC provider 6.x (#459) — review breaking + tests pairing | Grok | après #506 smoke |
| P2 | #643 security audit (draft) | Review only | pas de déploiement |

## Politique de vérité

Le site public est live. Le commerce ne l’est pas. Les deux phrases restent simultanément vraies jusqu’à preuve Explorer + IPN réel + My Packs.

## Historique

Les sondes 20–25 novembre restent dans le journal git (commits précédents sur main). Cette entrée du 28 novembre les supersède pour la posture opérationnelle.
