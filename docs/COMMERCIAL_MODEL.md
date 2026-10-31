---
hidden: false
---

# Modèle commercial xArtists — lock (2026-10-31)

**Source de vérité** : décision commerciale enregistrée dans GitBook revue nº 24 (brouillon) + ce document.

## Distinction stricte

| Offre | Facturation | Contenu | Droits |
|-------|-------------|---------|--------|
| **Packs IA** (Pulse / Yield / Sentinel) | **Achat unique** (crypto EGLD ou fiat EUR via PayBox / Stripe) — **sans abonnement** | NFT MultiversX édition limitée (Genesis) inclus | **Durables** — aucune expiration annuelle des droits NFT / d'accès liés au pack |
| **Produits Whop xArtists** | **Abonnement mensuel** | Accès aux produits et services du plan Whop (référence TCA) | Liés à la période d'abonnement active |

### Packs IA — règles produit

- Prix catalogue serveur (Rule 1) : **110 € / 75 € / 50 €** (Pulse / Yield / Sentinel).
- Ancres EGLD : 10 / 5 / 2.5.
- Caps Genesis hard-lock : Pulse **333** · Yield **500** · Sentinel **777**.
- Un achat = un siège SFT / NFT de la collection du pack.
- Le checkout **verrouille le rail** (crypto | fiat) pendant l'opération — pas de bascule mid-flow.
- Expiration du jeton de session = contrôle de **sécurité** uniquement (pas une limite commerciale des droits NFT).

### Whop — règles

- Section clairement séparée dans l'UI et la documentation.
- Référence TCA pour le périmètre des services inclus dans le plan.
- **Raccordement Whop → droits internes** (mapping adhésion → gates d'accès) **volontairement reporté** jusqu'à vérification des plans réels côté Whop.
- Aucune confusion avec les packs NFT : l'abonnement n'émet pas de NFT Genesis pack.

## Positions opérationnelles (inchangées)

- **NO-GO commercial** des packs et de l'exécution LIA réelle jusqu'à preuves de bout-en-bout :
  - paiement réel (smoke Sentinel + IPN signé)
  - livraison / mint NFT prouvé
  - droits d'accès activés
  - remboursements / fail-closed validés
- Mode simulation / paper maintenu (`VITE_LIA_LIVE_TRADING=0`).
- Aucun fallback Payment Link silencieux / paper path commercial.

## Checklist d'implémentation (PR associée)

- [x] Distinction packs (achat unique + NFT) vs Whop (abonnement) documentée
- [x] Droits NFT sans expiration annuelle formalisés
- [x] Rail de checkout verrouillé (comportement existant conservé et documenté)
- [ ] Section Whop UI + TCA (après plans réels)
- [ ] Mapping Whop membership → droits internes (post-vérification)
- [ ] Smoke paiement réel + preuve My Packs NFT

## Références

- GitBook revue nº 24 (dossier + patch)
- `docs/GENESIS_PACK_EDITIONS.md`
- `docs/ACCESS_PACK_CHECKOUT.md`
- `docs/PACK_QUOTE_RULE1.md`
- `apps/frontend/src/config/agentPacks.ts`
- `apps/frontend/src/components/CheckoutModal.tsx`
