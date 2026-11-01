# xArtists — Master Sprint Plan (Sprint 0 → 4)

**Décision commerciale** : No-Go jusqu’à clôture Sprint 0 + preuves S1–S2 + preuve d’achat réel + My Packs NFT.  
**LIA** : paper only jusqu’à gates verts.  
**Date de démarrage** : 2026-11-01

---

## Sprint 0 — Gel des risques & sécurisation — **VERT** (2026-11-01)

**Objectif** : aucune clé exposée connue · main protégée · Environment production · CODEOWNERS · slot absent du site public · Vellum tag-only.

### Livrables
- [x] CODEOWNERS + SECURITY.md + SPRINTS_MASTER
- [x] environment: production sur **20 workflows** SC (PR #222)
- [x] Branch protection `main`
- [x] Environment `production` + required reviewers
- [x] Secret scanning + push protection
- [x] SC_DEPLOYER_PEM lié à l’environment
- [x] Accès admin téléphone + email + passkey

**Critère de sortie** : ✅ atteint (admin confirmé Neltud).

---

## Sprint 1 — Preuves on-chain & verrouillage technique — **EN COURS**

**Objectif** : 1 achat documenté de bout en bout + pause testée + codeHash épinglé + owner multisig/timelock.

- [x] codeHash pins + `verify_pinned_codehashes.py` (11/11 live)
- [x] Runbooks micro-preuve + pause + owner plan
- [ ] CI Regression : step verify codeHash (cette PR)
- [ ] Micro-preuve Variante A ou B journalisée
- [ ] Exercice pause journalisé
- [ ] Owner multisig exécuté ou plan daté accepté
- [ ] CID IPFS définitifs

**Critère de sortie** : rapport d’achat + pause testée + codeHash en CI.

---

## Sprint 2 — Conformité, paiement & gate commercial

**Objectif** : textes validés + paiement réel testé + remboursement fonctionnel + avis juridique.

- [ ] Avis juridique préalable
- [ ] CGV + mentions + confidentialité
- [ ] Consentement cookies / RGPD
- [ ] Tests Stripe/PayBox réel + webhooks signés
- [ ] Remboursements + idempotence + journal d’audit
- [ ] Revue marketing : pas de yield non vérifiable

**Critère de sortie** : documents légaux + smoke paiement réel + remboursement OK.

---

## Sprint 3 — Plateforme, qualité & sécurité produit

- [ ] Headers sécurité Pages (CSP, XFO, …)
- [ ] Staging / RC distinct
- [ ] Monitoring + page d’état
- [ ] Perf mobile + a11y + i18n FR/EN
- [ ] Nettoyage repo

---

## Sprint 4 — Soft launch

- [ ] Cohorte limitée + plafonds
- [ ] Support + surveillance 7 j
- [ ] Go/No-Go formel documenté

---

## Règles transverses

1. LIA reste en paper (`VITE_LIA_LIVE_TRADING=0`) jusqu’à validation explicite.
2. Aucun armement public de paiement avant Sprint 2 vert.
3. Périmètre Go recommandé : Genesis packs + galerie + LIA Hub paper.
4. Tout job qui lit un secret de déploiement passe par Environment `production`.
