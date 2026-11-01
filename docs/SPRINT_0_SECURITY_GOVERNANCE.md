# Sprint 0 — Gel des risques & sécurisation

**Statut** : PACKAGE CODE COMPLET — en attente actions admin + merge  
**Branche** : `sprint-0/governance-hardening` (tip ~0ee77e7)  
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
- [x] environment: production sur **20 workflows** SC (tous les jobs utilisant SC_DEPLOYER_PEM)
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

### 2.3 Workflows sensibles — environment production (20/20)

1. deploy-agents-marketplace.yml  
2. deploy-marketplaces.yml  
3. deploy-scs.yml  
4. deploy-staking.yml  
5. deploy-treasury.yml  
6. deploy-tro-gov.yml  
7. deploy-venue-split.yml  
8. deploy-wave3.yml  
9. issue-pack-collections.yml  
10. issue-agent-pack-collections.yml  
11. mint-3-packs-to-admin.yml  
12. mint-test-buypack.yml  
13. update-pack-prices.yml  
14. configure-pack-collections.yml  
15. microtest-dao.yml  
16. microtest-tro-stake.yml  
17. microtest-treasury-dust.yml  
18. redeploy-tro-staking.yml  
19. upgrade-tro-staking.yml  
20. rentpay-dust.yml  

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
| 20 workflows sous environment production | Code sur branche (fait) |

---

## 4. Actions manuelles (admin — Neltud)

1. Settings → Branches → protéger `main` (require PR, require reviews, no force-push)
2. Settings → Environments → créer `production` + required reviewers
3. Secret scanning + push protection ON
4. Déplacer / lier `SC_DEPLOYER_PEM` à l’environment `production` (plus en secret repo nu)
5. Rotation clés sandbox si applicable
6. Merger la PR Sprint 0

---

## 5. Après merge

- Actions admin ci-dessus (bloquantes pour sortie Sprint 0)
- Sprint 1 (preuves on-chain) uniquement quand Sprint 0 vert

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
