# Sprint 0 — Gel des risques & sécurisation

**Statut** : EN COURS (démarré 2026-11-01)  
**Objectif** : Aucune clé exposée connue · main protégée · Vellum tag-only · slot absent du site public  
**Décision commerciale** : No-Go jusqu’à clôture Sprint 0 + preuves S1–S2

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

## 2. Checklist Sprint 0 (exécutable)

### 2.1 Gouvernance repo (code + admin)

- [x] CODEOWNERS ajouté (ce PR)
- [ ] Branch protection sur `main`
  - Require pull request reviews (min 1)
  - Require status checks to pass
  - Restrict who can push
  - Do not allow force pushes / deletions
- [ ] Required status checks sur jobs critiques (static, regression, paybox tests si présents)
- [ ] GitHub Environment `production` créé
  - Required reviewers pour les jobs qui lisent `SC_DEPLOYER_PEM`
  - Secrets liés uniquement à cet environment
- [ ] Secret scanning + push protection activés (Settings → Code security)
- [ ] Dependabot maintenu (déjà présent)

### 2.2 Secrets & clés

- [ ] Inventaire de toutes les clés ayant touché sandbox / non-prod
- [ ] Rotation des clés concernées
- [ ] Confirmation : aucune PEM / private key dans le repo, logs, artifacts, history
- [ ] SC_DEPLOYER_PEM uniquement dans Environment `production` (pas en secret global si possible)
- [ ] LIA Ops PEM uniquement dans Vellum vault (jamais GitHub)

### 2.3 Workflows sensibles

Workflows utilisant `SC_DEPLOYER_PEM` (à durcir) :
- deploy-agents-marketplace.yml
- deploy-marketplaces.yml
- deploy-scs.yml / deploy-staking.yml / deploy-treasury.yml / deploy-tro-gov.yml / deploy-venue-split.yml / deploy-wave3.yml
- update-pack-prices.yml
- issue-pack-collections.yml / configure-pack-collections.yml / mint-*
- microtest-* / redeploy-tro-staking.yml

Actions recommandées :
- [ ] Ajouter `environment: production` sur les jobs qui lisent le secret
- [ ] Conserver le gate `confirm_mainnet=DEPLOY_MAINNET`
- [ ] Cleanup PEM en `if: always()` (déjà présent sur plusieurs)
- [ ] Interdire `pull_request_target` (déjà absent — confirmer)

### 2.4 Slot & surface publique

- [x] Slot documenté comme `isPayable=false` / REAL fermé (docs uniquement)
- [ ] Vérifier absence de route / lien / wallet / texte « slot » jouable sur le site public (Pages)
- [ ] Vérifier absence de code de slot déployable dans le repo principal

### 2.5 Vellum

- [ ] Politique tag-only : pas d’auto-pull sur branches
- [ ] Documenté dans VELLUM_WORKFLOW_MAP.md (déjà paper-first, secrets dans vault)

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

## 5. Prochaine étape immédiate après merge

- Exécuter les actions manuelles ci-dessus
- Ouvrir PR de hardening workflows (ajout `environment: production`)
- Passer à Sprint 1 (preuves on-chain) uniquement quand Sprint 0 est vert

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
