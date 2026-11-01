# Sprint 2 — Conformité, paiement & gate commercial

**Statut** : SKELETON (après S0 VERT + S1 en cours)  
**Dépendance** : micro-preuve S1 (au moins Variante A) recommandée avant armement fiat public  
**Décision** : No-Go commercial jusqu’à checklist verte ci-dessous

## Objectifs

1. Socle juridique visible (CGV, mentions, confidentialité, cookies)  
2. Avis juridique préalable documenté  
3. Smoke paiement réel (PayBox / Stripe) + IPN signé  
4. Remboursement + idempotence + journal d’audit  
5. Marketing sans claim de yield non vérifiable  

## Checklist

### 2.1 Juridique
- [ ] Entité vendeuse identifiée (raison sociale, SIREN/équivalent)  
- [ ] CGV publiées sur le site  
- [ ] Mentions légales  
- [ ] Politique de confidentialité (RGPD)  
- [ ] Bannière / consentement cookies  
- [ ] Avis avocat ou note de conformité datée  

### 2.2 Paiement
- [ ] PayBox PROD : JWT + IPN RSA fail-closed (déjà armé côté code — smoke réel dû)  
- [ ] 1 paiement réel Sentinel 50 € journalisé  
- [ ] Webhook/IPN vérifié  
- [ ] My Packs / NFT entitlement visible  
- [ ] Remboursement testé  

### 2.3 Marketing & produit
- [ ] Wording packs aligné modèle commercial (pas de promesse de rendement)  
- [ ] LIA paper explicite sur UI  
- [ ] Slot non jouable  

## Critère de sortie Sprint 2

Documents légaux en ligne + smoke paiement réel + refund OK + note juridique.

## Doctrine

Périmètre Go soft : Genesis packs + galerie + LIA Hub **paper**.  
Trading live LIA découplé du lancement commercial.
