# Sprint 0 — Gel des risques & sécurisation

**Statut** : EN COURS (démarré 2026-11-01)  
**Branche** : `sprint-0/governance-hardening`  
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

- [x] CODEOWNERS ajouté
- [x] SECURITY.md
- [x] SPRINTS_MASTER.md
- [x] environment: production sur deploy-agents-marketplace.yml
- [ ] Branch protection sur `main` (admin)
- [ ] Required status checks sur jobs critiques (admin)
- [ ] GitHub Environment `production` créé + required reviewers (admin)
- [ ] Secret scanning + push protection (admin)
- [ ] Dependabot maintenu (déjà présent)

### 2.2 Secrets & clés

- [ ] Inventaire de toutes les clés ayant touché sandbox / non-prod
- [ ] Rotation des clés concernées
- [ ] Confirmation : aucune PEM / private key dans le repo, logs, artifacts, history
- [ ] SC_DEPLOYER_PEM uniquement dans Environment `production`
- [ ] LIA Ops PEM uniquement dans Vellum vault (jamais GitHub)

### 2.3 Workflows sensibles

- [x] Pattern `environment: production` appliqué sur deploy-agents-marketplace
- [ ] Appliquer le même pattern sur : deploy-marketplaces, deploy-scs, deploy-staking, deploy-treasury, deploy-tro-gov, deploy-venue-split, deploy-wave3, update-pack-prices, issue-*, mint-*, microtest-*, redeploy-*
- [x] Gate `confirm_mainnet=DEPLOY_MAINNET` conservé
- [x] Cleanup PEM en `if: always()`
- [x] Absence de `pull_request_target` confirmée

### 2.4 Slot & surface publique

- [x] Slot documenté comme `isPayable=false` / REAL fermé (docs uniquement)
- [ ] Vérifier absence de route / lien / wallet / texte « slot » jouable sur le site public (Pages)
- [ ] Vérifier absence de code de slot déployable dans le repo principal

### 2.5 Vellum

- [x] Doctrine paper-first + secrets dans vault déjà documentée
- [ ] Politique tag-only formalisée (pas d’auto-pull sur branches)

---

## 3. Critères de sortie Sprint 0

| Critère | Preuve |
|---------|--------|
| Aucune clé exposée connue | Inventaire + rotation documentée |
| main protégée | Capture Settings → Branches |
| Environment production | Capture Settings → Environments |
| CODEOWNERS actif | Fichier présent + reviews requises |
| Slot absent du site public | Review manuelle Pages + search code |
| Vellum tag-only | Doc + procédure ops |

---

## 4. Actions manuelles (admin GitHub — Neltud)

1. Settings → Branches → Add rule for `main`
2. Settings → Environments → New environment `production` → Required reviewers
3. Settings → Code security and analysis → Secret scanning + Push protection
4. Déplacer / lier `SC_DEPLOYER_PEM` à l’environment `production`
5. Rotation clés si elles ont touché sandbox

---

## 5. Prochaine étape après merge

- Exécuter les actions manuelles ci-dessus
- Appliquer `environment: production` sur le reste des workflows SC
- Passer à Sprint 1 uniquement quand Sprint 0 est vert

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
