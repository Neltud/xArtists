# Sprint 2 — Conformité, paiement & gate commercial

**Statut** : EN COURS (S1-A VERT 2026-11-01)  
**Dépendance** : micro-preuve A **faite** · Variante B + légal final **ouverts**  
**Décision** : No-Go commercial jusqu’à checklist verte

## Objectifs

1. Socle juridique visible (CGV, mentions, confidentialité, cookies)  
2. Avis juridique préalable documenté  
3. Smoke paiement réel (PayBox) + IPN signé  
4. Remboursement + idempotence + journal d’audit  
5. Marketing sans claim de yield non vérifiable  

## Checklist

### 2.1 Juridique

- [x] Entité vendeuse identifiée — `LEGAL_ENTITY` (Nelson Tuduri, EI, SIRET `82418276000028`)  
- [x] Page `/legal` avec onglets mentions / CGU / terms / privacy / risk / process  
- [ ] Revue avocat / note de conformité datée  
- [ ] Consentement cookies (bannière) si tracking  
- [ ] Contact email éditeur renseigné (aujourd’hui Issues GitHub)  

### 2.2 Paiement

- [x] Code PayBox PROD path : JWT + IPN RSA fail-closed (P0)  
- [x] Micro-preuve **A** on-chain buyPack (run 41309878814)  
- [ ] 1 paiement réel Sentinel 50 € journalisé — voir [OPERATOR_CARD_MICRO_PROOF_B.md](./OPERATOR_CARD_MICRO_PROOF_B.md)  
- [ ] Webhook/IPN vérifié en prod  
- [ ] My Packs / NFT entitlement visible après fiat  
- [ ] Remboursement testé  

### 2.3 Marketing & produit

- [x] Soft-launch IA : lab masqué (`?lab=1`)  
- [x] Nav core : Packs · Musée · Marché · LIA  
- [ ] Wording packs sans promesse de rendement (audit copy)  
- [x] LIA paper default (`VITE_LIA_LIVE_TRADING=0`)  
- [x] Slot redirigé `/`  

## Critère de sortie Sprint 2

Note juridique + smoke fiat B + refund OK + copy clean.

## Doctrine

Périmètre Go soft : Genesis packs + galerie + LIA Hub **paper**.  
Trading live LIA découplé du lancement commercial.
