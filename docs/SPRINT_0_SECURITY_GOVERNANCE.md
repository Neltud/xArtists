# Sprint 0 — Gel des risques & sécurisation

**Statut** : CODE MERGÉ sur main (PR #222) — **admin residual** pour VERT  
**Checklist admin détaillée** : [ADMIN_CHECKLIST_SPRINT_0.md](./ADMIN_CHECKLIST_SPRINT_0.md)  
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

- [x] CODEOWNERS (racine)
- [x] SECURITY.md
- [x] SPRINTS_MASTER.md + Sprint 1–4 skeletons
- [x] environment: production sur **20 workflows** SC (PR #222)
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

### 2.3 Workflows sensibles — 20/20 sous environment production

Voir PR #222. Gates confirm_* · cleanup PEM · pas de pull_request_target.

### 2.4 Slot & surface publique

- [x] Slot documenté `isPayable=false` / REAL fermé
- [ ] Vérifier absence route / lien jouable sur le site public
- [ ] Vérifier absence code slot déployable dans le repo principal

### 2.5 Vellum

- [x] Doctrine paper-first + secrets vault documentée
- [ ] Politique tag-only formalisée

---

## 3. Critères de sortie Sprint 0 (VERT)

| Critère | Preuve |
|---------|--------|
| 20 workflows environment production | PR #222 mergée |
| main protégée | Capture Settings → Branches |
| Environment production | Capture Settings → Environments |
| SC_DEPLOYER_PEM scoped environment | Capture Environment secrets (noms) |
| Secret scanning + push protection | Capture Security |
| CODEOWNERS | Fichier racine |

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
