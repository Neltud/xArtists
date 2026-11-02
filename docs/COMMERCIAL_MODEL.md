---
hidden: false
---

# Modèle commercial xArtists — lock (2026-11-02)

## Distinction stricte

| Offre | Facturation | Contenu | Droits |
|-------|-------------|---------|--------|
| **Packs IA** (Pulse / Yield / Sentinel) | **Achat unique** | SFT Genesis mainnet (recto peinture · verso HUD) | **Durables** |
| **TCA Membership Whop** | Abonnement mensuel / annuel | Services only | Période active — **pas de NFT** |

### Packs — prix Rule 1

| Pack | EUR | EGLD |
|------|-----|------|
| Pulse | 110 | 33 |
| Yield | 75 | 22.5 |
| Sentinel | 50 | 15 |

Caps: 333 / 500 / 777 · Collections XAIPLS / XAIYLD / XAISNT.

### Mint

**Operator GO 2026-11-02** : `live_mint=true` + mainnet authorized.
Workflow: `.github/workflows/mint-on-payment.yml` (env production + `SC_DEPLOYER_PEM`).

LIA live trading: still **off** (`VITE_LIA_LIVE_TRADING=0`) until separate GO.

### Whop TCA

See `docs/WHOP_TCA_MEMBERSHIP.md` — 29 €/mo · 290 €/yr targets — never triggers mint.
