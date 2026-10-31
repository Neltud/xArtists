---
hidden: false
---

# Sprint Abouti — Parallèle B (2026-10-31)

**Branche :** `sprint/abouti-parallel-b`  
**Horizon :** 4 jours (ChatGPT Work offline)  
**Grok :** delivery code + docs  
**Owner :** smoke paiement + validation mobile + Dependabot

## Objectifs

| Track | Livrable |
|-------|----------|
| **Smoke (B-S)** | 1 paiement Sentinel réel → `order_id` → IPN → My Packs |
| **UX (B-U)** | Status paper cohérent · packs lock · carte/CC déjà #217 · musée a11y |

## Track Smoke — procédure owner

1. Wallet xPortal connecté sur https://neltud.github.io/xArtists/
2. Pack **Sentinel** (50 € catalogue serveur) · rail fiat PayBox
3. Terms of Access acceptés
4. Paiement → capturer **`order_id`**
5. Coller ici / GitBook :
   - `order_id` =
   - horodatage =
   - montant affiché =
   - IPN reçu ? (oui/non)
   - My Packs visible ? (oui/non / job)
6. Si échec : `VITE_PAYBOX_ENABLED=false` ou `PAYBOX_ENV=preprod` (kill switch docs/SMOKE_PAYBOX_P0.md)

**Gate GO commercial = S1 (IPN paid) AND S2 (NFT/droit My Packs).**  
Sans les deux → **NO-GO** (produit abouti paper uniquement).

## Track UX — code

- [x] StatusIndicator : LIVE uniquement si `VITE_LIA_LIVE_TRADING=1` + wallet signant ; sinon PAPER explicite
- [x] GoLivePage : bandeau NO-GO + lien smoke + mode paper dominant
- [ ] Musée : focus clavier / commandes (lot suivant)
- [ ] Recette mobile parcours audit #24

## Décision fin de sprint

- **Abouti paper** si UX + docs verts, smoke non fait ou partiel
- **Commercial candidate** si S1+S2 verts + marketing lock déjà en main

## Références

- `docs/SMOKE_PAYBOX_P0.md`
- `docs/COMMERCIAL_MODEL.md`
- `docs/SECURITY_HEADERS_PAGES_P0.md`
- PR #214 #215 #217 (main)
