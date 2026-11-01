# Sprint 0 — Gel des risques & sécurisation

**Statut** : **VERT** (2026-11-01)  
**Code** : PR #222 mergée (20 workflows `environment: production`)  
**Admin** : confirmé par Neltud — accès téléphone + email + passkey  
**Checklist détaillée** : [ADMIN_CHECKLIST_SPRINT_0.md](./ADMIN_CHECKLIST_SPRINT_0.md)

**Décision commerciale** : No-Go jusqu’à preuves Sprint 1 (micro-achat) + Sprint 2 (conformité).

Voir aussi : [SPRINTS_MASTER.md](./SPRINTS_MASTER.md) · [SECURITY.md](../SECURITY.md)

---

## 1. Rôles (séparation stricte)

| Rôle | Responsabilité | Clés / accès | Règle |
|------|----------------|--------------|-------|
| **deployer** | Déploiement / upgrade SC | SC_DEPLOYER_PEM (GitHub Environment `production` uniquement) | Jamais sur laptop permanent, jamais logué |
| **owner** | Ownership on-chain des SC | Multisig + timelock (cible Sprint 1) | Pas de clé unique |
| **lia_ops** | Exécution paper / future micro-live | LIA Ops PEM (Vellum vault uniquement) | `LIA_LIVE_TRADING=0` par défaut |
| **treasuries** | Destinations de fonds | Adresses froides / warm séparées | Pas de PEM dans CI |

---

## 2. Checklist Sprint 0 — clôturée

### 2.1 Gouvernance repo

- [x] CODEOWNERS (racine)
- [x] SECURITY.md
- [x] SPRINTS_MASTER.md + Sprint 1–4
- [x] environment: production sur **20 workflows** SC (PR #222)
- [x] Branch protection `main` (admin)
- [x] GitHub Environment `production` + required reviewers (admin)
- [x] Secret scanning + push protection (admin)
- [x] Accès admin : téléphone + email + passkey
- [x] Dependabot maintenu

### 2.2 Secrets & clés

- [x] SC_DEPLOYER_PEM dans Environment `production`
- [x] LIA Ops PEM hors GitHub (Vellum vault)
- [ ] Inventaire / rotation sandbox — à confirmer si clé a touché non-prod

### 2.3 Workflows

- [x] 20/20 sous `environment: production`
- [x] Gates confirm_* · cleanup PEM · pas de `pull_request_target`

### 2.4 Slot

- [x] `isPayable=false` / REAL fermé
- [ ] Review route publique (ongoing S1)

### 2.5 Vellum

- [x] Paper-first documenté
- [ ] Politique tag-only formalisée (S1)

---

## 3. Critères de sortie — VERT

| Critère | Preuve |
|---------|--------|
| 20 workflows environment production | PR #222 |
| main protégée | Admin 2026-11-01 |
| Environment production | Admin 2026-11-01 |
| SC_DEPLOYER_PEM scoped | Admin 2026-11-01 |
| Secret scanning + push protection | Admin 2026-11-01 |
| Accès 2FA / passkey | Confirmé Neltud |

**Suite** : Sprint 1 — CI codeHash · micro-preuve buy→mint · pause exercise · plan multisig.

**Doctrine** : fail-closed · paper-first · no commercial GO jusqu’à smoke réel + My Packs NFT + conformité.
