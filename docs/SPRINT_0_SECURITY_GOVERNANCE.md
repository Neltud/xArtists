# Sprint 0 — Gel des risques & sécurisation

**Statut** : EN COURS — package code prêt (8 workflows hardenés)  
**Branche** : `sprint-0/governance-hardening` (tip ~69280dd2)  
**Objectif** : Aucune clé exposée connue · main protégée · Vellum tag-only · slot absent du site public  
**Décision commerciale** : No-Go jusqu’à clôture Sprint 0 + preuves S1–S2

Voir aussi : [SPRINTS_MASTER.md](./SPRINTS_MASTER.md) · [SECURITY.md](../SECURITY.md)

---

## 1. Rôles (séparation stricte)

| Rôle | Responsabilité | Clés / accès | Règle |
|------|----------------|--------------|-------|
| **deployer** | Déploiement / upgrade SC | SC_DEPLOYER_PEM (GitHub Environment `production` uniquement) | Jamais sur laptop permanent, jamais logué |
| **owner** | Ownership on-chain des SC | Multisig + timelock (cible Sprint 1) | Pas de clé unique |
| **lia_ops** | Exécution paper / future micro-live | LIA Ops PEM (Vellum vault uniquement) | `LIA_LIVE_TRADING=0` par défaut |
| **treasuries** | Destinations de fonds | Adresses froides / warm séparées | Pas de PEM dans CI |

Toute clé ayant touché un sandbox ou un environnement non-prod **doit être rotée** avant usage prod.

---

## 2. Checklist Sprint 0

### 2.1 Gouvernance repo (code + admin)

- [x] CODEOWNERS
- [x] SECURITY.md
- [x] SPRINTS_MASTER.md + Sprint 1–4 skeletons
- [x] environment: production sur **8 workflows** critiques
- [ ] Branch protection sur `main` (admin)
- [ ] Required status checks (admin)
- [ ] GitHub Environment `production` + required reviewers (admin)
- [ ] Secret scanning + push protection (admin)
- [x] Dependabot maintenu

### 2.2 Secrets & clés

- [ ] Inventaire clés sandbox / non-prod
- [ ] Rotation des clés concernées
- [ ] Confirmation : aucune PEM dans repo / logs / history
- [ ] SC_DEPLOYER_PEM uniquement dans Environment `production`
- [ ] LIA Ops PEM uniquement dans Vellum vault

### 2.3 Workflows sensibles — environment production

**Hardened (8) :**
1. deploy-agents-marketplace.yml
2. deploy-marketplaces.yml
3. update-pack-prices.yml
4. deploy-scs.yml
5. mint-3-packs-to-admin.yml
6. configure-pack-collections.yml
7. microtest-dao.yml
8. redeploy-tro-staking.yml

**Restants (même pattern) :**
- issue-pack-collections.yml / issue-agent-pack-collections.yml
- microtest-tro-stake.yml / microtest-treasury-dust.yml
- deploy-staking.yml / deploy-treasury.yml / deploy-tro-gov.yml / deploy-venue-split.yml / deploy-wave3.yml
- mint-test-buypack.yml

- [x] Gates confirm_* conservés
- [x] Cleanup PEM `if: always()` sur les jobs hardenés
- [x] Absence de `pull_request_target` confirmée

### 2.4 Slot & surface publique

- [x] Slot documenté `isPayable=false` / REAL fermé
- [ ] Vérifier absence route / lien jouable sur le site public
- [ ] Vérifier absence code slot déployable dans le repo principal

### 2.5 Vellum

- [x] Doctrine paper-first + secrets vault documentée
- [ ] Politique tag-only formalisée

---

## 3. Critères de sortie Sprint 0

| Critère | Preuve |
|---------|--------|
| Aucune clé exposée connue | Inventaire + rotation |
| main protégée | Capture Settings → Branches |
| Environment production | Capture Settings → Environments |
| CODEOWNERS actif | Fichier + reviews |
| Slot absent du site public | Review Pages + search |
| Vellum tag-only | Doc + procédure |

---

## 4. Actions manuelles (admin — Neltud)

1. Settings → Branches → protéger `main`
2. Settings → Environments → `production` + required reviewers
3. Secret scanning + push protection
4. Lier `SC_DEPLOYER_PEM` à l’environment `production`
5. Rotation clés sandbox si applicable

---

## 5. Après merge

- Actions admin ci-dessus
- Finir le hardening des workflows restants
- Sprint 1 (preuves on-chain) uniquement quand Sprint 0 vert

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
