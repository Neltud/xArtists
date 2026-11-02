---
hidden: false
---

# Modèle commercial xArtists — lock (2026-11-02)

**Source de vérité** : GitBook revue nº 24 + ce document + `agentPacks.ts`.

## Distinction stricte

| Offre | Facturation | Contenu | Droits |
|-------|-------------|---------|--------|
| **Packs IA** (Pulse / Yield / Sentinel) | **Achat unique** (crypto EGLD ou fiat EUR via PayBox / Whop one_time) — **sans abonnement** | SFT MultiversX édition limitée (Genesis) inclus — recto peinture · verso HUD | **Durables** — aucune expiration annuelle |
| **TCA Membership Whop** | **Abonnement** mensuel / annuel | Services (briefings LIA paper, hub lecture) | Liés à la période d'abonnement — **pas de NFT Genesis** |

### Packs IA — règles produit

- Prix catalogue Rule 1 : **110 € / 75 € / 50 €** (Pulse / Yield / Sentinel).
- Parité EGLD (ref 100 € ≈ 30 EGLD) : **33 / 22.5 / 15**.
- Caps Genesis hard-lock : Pulse **333** · Yield **500** · Sentinel **777**.
- Collections mainnet : `XAIPLS-2cf72b` · `XAIYLD-987e24` · `XAISNT-3d8a6b`.
- Un achat = un siège SFT de la collection du pack.
- Checkout verrouille le rail (crypto | fiat) pendant l'opération.

### Whop TCA — règles

- Produit séparé : voir `docs/WHOP_TCA_MEMBERSHIP.md` (29 €/mois · 290 €/an cibles).
- **Jamais** de mint Genesis sur renouvellement TCA.
- Mapping membership → gates internes **après** `prod_` réel.

## NO-GO jusqu'à S1 + S2

1. **S1** — 1 paiement réel (smoke Sentinel 50 €) + IPN signé fail-closed
2. **S2** — My Packs affiche preuve NFT/SFT (on-chain identifier) + carte Genesis

`VITE_LIA_LIVE_TRADING=0` · mint paper · pas de Payment Link silencieux.

## Checklist

- [x] Distinction packs vs TCA documentée
- [x] GenesisCard3D + landings `/packs/:id`
- [x] mint-on-payment.yml paper-first
- [x] My Packs cartes 3D (preuve visuelle)
- [ ] TCA product `prod_` Whop + wire dApp
- [ ] S1 paiement réel
- [ ] S2 mint on-chain prouvé dans My Packs

## Références

- `docs/GO_LIVE_S1_S2.md`
- `docs/PACK_NFT_MINT_METADATA.md`
- `docs/WHOP_TCA_MEMBERSHIP.md`
- `apps/frontend/src/config/agentPacks.ts`
