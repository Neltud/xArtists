# xArtists — Master Sprint Plan (Sprint 0 → 4)

**Décision commerciale** : No-Go jusqu’à clôture Sprint 0 + preuves S1–S2 + preuve d’achat réel + My Packs NFT.  
**LIA** : paper only jusqu’à gates verts.  
**Date de démarrage** : 2026-11-01

---

## Sprint 0 — Gel des risques & sécurisation (EN COURS)

**Objectif** : aucune clé exposée connue · main protégée · Environment production · CODEOWNERS · slot absent du site public · Vellum tag-only.

### Livrables code (cette branche)
- [x] CODEOWNERS
- [x] docs/SPRINT_0_SECURITY_GOVERNANCE.md
- [x] SECURITY.md
- [x] environment: production sur deploy-agents-marketplace.yml
- [ ] environment: production sur les autres workflows SC (pattern à appliquer)

### Actions admin (Neltud — manuelles)
- [ ] Branch protection `main`
- [ ] Environment `production` + required reviewers
- [ ] Secret scanning + push protection
- [ ] SC_DEPLOYER_PEM lié à l’environment `production`
- [ ] Rotation clés sandbox si applicable

**Critère de sortie** : checklist admin cochée + CODEOWNERS merge + au moins 1 workflow critique sous environment.

---

## Sprint 1 — Preuves on-chain & verrouillage technique

**Objectif** : 1 achat réel documenté de bout en bout + pause testée + codeHash épinglé + owner multisig/timelock.

- [ ] Build reproductible + hash épinglé (CI)
- [ ] Vérification codeHash on-chain vs hash épinglé
- [ ] Owner SC → multisig + timelock
- [ ] Adresses canoniques vérifiées côté front
- [ ] Micro-preuve d’achat pack (plus petit pack) :
  - achat → NFT reçu → supply débitée → fonds dans bucket → annulation/remboursement
- [ ] Exercice de pause d’urgence réussi
- [ ] Politique de prix explicite et vérifiée
- [ ] CID IPFS définitifs

**Critère de sortie** : rapport d’achat réel + pause testée + codeHash en CI.

---

## Sprint 2 — Conformité, paiement & gate commercial

**Objectif** : textes validés + paiement réel testé + remboursement fonctionnel + avis juridique.

- [ ] Avis juridique préalable
- [ ] CGV + mentions légales + politique de confidentialité
- [ ] Consentement cookies / RGPD
- [ ] Tests Stripe réel + webhooks signés
- [ ] Remboursements + idempotence + journal d’audit
- [ ] Auth front → agent 8008
- [ ] Revue marketing : suppression de tout wording de rendement non vérifiable

**Critère de sortie** : documents légaux + smoke paiement réel + remboursement OK.

---

## Sprint 3 — Plateforme, qualité & sécurité produit

**Objectif** : staging opérationnel + repo propre + perf mobile + page d’état.

- [ ] Hébergement avec en-têtes de sécurité (CSP, XFO, etc.)
- [ ] Staging / Release Candidate distinct
- [ ] Monitoring + page d’état + alertes
- [ ] Revue performance mobile + accessibilité
- [ ] i18n FR/EN
- [ ] Nettoyage repo (fichiers de bruit)
- [ ] Probes hors historique / pas de release-trigger dans le code

**Critère de sortie** : staging live + page d’état + perf mobile conforme.

---

## Sprint 4 — Soft launch

**Objectif** : cohorte limitée + plafonds + support + 7 jours de surveillance + Go/No-Go formel.

- [ ] Cohorte limitée
- [ ] Plafonds de supply et par wallet
- [ ] Support client actif
- [ ] Surveillance 7 jours
- [ ] Audit / revue indépendante des composants critiques
- [ ] Revue Go / No-Go avec métriques (incidents, remboursements, écarts prix, taux d’erreur)

**Critère de sortie** : décision Go/No-Go documentée + soft launch validé.

---

## Règles transverses

1. LIA reste en paper (`VITE_LIA_LIVE_TRADING=0`) jusqu’à validation explicite.
2. Aucun armement public de paiement avant Sprint 2 vert.
3. Périmètre Go recommandé : Genesis packs + galerie + LIA Hub paper.
4. Tout job qui lit un secret de déploiement doit passer par Environment `production`.
