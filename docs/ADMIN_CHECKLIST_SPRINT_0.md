# Checklist admin Sprint 0 — pas à pas (Settings GitHub)

**Qui** : Neltud (owner du repo)  
**Quand** : immédiatement après merge PR #222 (déjà fait)  
**Pourquoi** : sans ces 5 actions, les workflows `environment: production` ne peuvent pas lire `SC_DEPLOYER_PEM` — fail-closed voulu.

---

## 1. Branch protection `main`

1. Ouvre https://github.com/Neltud/xArtists/settings/branches  
2. **Add branch ruleset** (ou Edit rule sur `main`)  
3. Branch name pattern : `main`  
4. Coche :
   - ✅ Require a pull request before merging  
   - ✅ Require approvals : **1**  
   - ✅ Dismiss stale PR approvals when new commits are pushed  
   - ✅ Require status checks to pass (si des checks critiques existent : CI / test:release)  
   - ✅ Block force pushes  
   - ✅ Restrict deletions  
5. Save  

**Preuve** : capture Settings → Branches montrant `main` protégée.

---

## 2. Environment `production` + required reviewers

1. Ouvre https://github.com/Neltud/xArtists/settings/environments  
2. **New environment** → nom exact : `production`  
3. **Required reviewers** → ajoute `@Neltud` (et un second si disponible)  
4. Wait timer : 0 (ou 5 min si tu veux un délai)  
5. Deployment branches : Selected branches → `main` only (recommandé)  
6. Save protection rules  

**Preuve** : capture Environment `production` avec required reviewers.

---

## 3. Secret scanning + push protection

1. Ouvre https://github.com/Neltud/xArtists/settings/security_analysis  
2. **Secret scanning** → Enable  
3. **Push protection** → Enable  
4. (Optionnel) Dependabot alerts / security updates déjà utiles  

**Preuve** : capture Security showing both ON.

---

## 4. Lier `SC_DEPLOYER_PEM` à l’environment `production`

**Important** : le secret doit vivre dans l’**Environment**, pas seulement en Repository secret nu.

1. Settings → Environments → `production` → **Add secret**  
2. Name : `SC_DEPLOYER_PEM`  
3. Value : la PEM déployeur (format PEM complet ou hex selon ton usage actuel)  
4. Si le même nom existe déjà en **Repository secrets** :  
   - soit tu le **supprimes** du niveau repo après copie dans environment  
   - soit tu le laisses en secours temporaire puis tu le retires sous 48 h  
5. Vérifie qu’aucun autre secret de clé privée n’est en clair dans repo / logs  

**Test** : lance un workflow `workflow_dispatch` non destructif (ex. un microtest avec gate `RUN_*` **sans** confirmer) — le job doit **attendre l’approbation** Environment avant de démarrer.

**Preuve** : capture Environment secrets list (noms seulement, jamais la valeur).

---

## 5. Rotation clés sandbox (si applicable)

1. Liste toute clé PEM / seed ayant touché sandbox, CI non-prod, laptop partagé  
2. Si `SC_DEPLOYER_PEM` a fuité ou a tourné hors Environment → **génère une nouvelle clé deployer**  
3. Transfère ownership / re-fund la nouvelle adresse si besoin  
4. Mets à jour le secret Environment uniquement  
5. Documente la date de rotation dans ce fichier ou `SECURITY.md`  

**LIA Ops PEM** : reste **uniquement** dans Vellum vault — jamais GitHub.

---

## 6. Validation Sprint 0 vert

Coche quand fait :

- [ ] Branch protection `main` active  
- [ ] Environment `production` + required reviewers  
- [ ] Secret scanning + push protection ON  
- [ ] `SC_DEPLOYER_PEM` dans Environment `production`  
- [ ] Rotation documentée (ou N/A justifié)  
- [ ] 20 workflows `environment: production` déjà sur main (PR #222)  

Quand les 6 cases sont vertes → **Sprint 0 = VERT**.  
Ensuite seulement : exécution micro-preuves Sprint 1 (toujours paper LIA).

---

## Ce que Grok / CI ne peut pas faire à ta place

Les Settings GitHub (protection, environments, secrets) sont **owner-only**.  
Le code est prêt ; le verrou admin est entre tes mains.
