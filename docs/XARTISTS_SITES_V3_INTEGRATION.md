---
hidden: true
noIndex: true
---

# Intégration dans Neltud/xArtists

## Version de référence

* Site : https://xartists.loftypearl128.chatgpt.site/
* Version Sites : 3.
* Source : `8a607c8831234fe738a091a5a4caf325811c1b5b`.
* Base GitHub examinée : `e14d586e054556768e35ed50043b0950bc4b686c` sur `main`.
* Branche locale proposée par le script : `codex/xartists-sites-v3-exact`.

Les 751 fichiers de `source/` sont destinés à `apps/frontend/`. La source inclut l’accueil, les 36 modules, les 50 alias de routes, les huit langues, les musées tactiles et la correction du cycle de connexion xPortal. Le sous-arbre frontend est un instantané exact de la version validée. Le script d’import conserve les autres répertoires du dépôt depuis le HEAD du clone fourni.

Le script ajoute `GROK_PROMPT.md`, `docs/XARTISTS_SITES_V3_INTEGRATION.md`, `docs/xartists-sites-v3-source-manifest.json` et `docs/xartists-sites-v3-provenance.json` au clone. Le manifeste référence les chemins relativement à `apps/frontend`.

## Hébergement

Adaptations **déjà appliquées** dans le commit local `73099d5` (à pousser avec le frontend) :

1. `vite.config.ts` → `base: '/xArtists/'`
2. `VITE_DAPP_URL=https://neltud.github.io/xArtists`
3. Manifeste PWA `start_url` / `scope` / icons sous `/xArtists/`
4. canonical + `og:url` → `https://neltud.github.io/xArtists/`

Vérifier aussi les domaines autorisés du projet WalletConnect si le relais refuse la nouvelle origine.

## Statut Grok (2026-10-19)

### Fait localement

1. Extraction vérifiée : **751 fichiers**, commit Sites `8a607c8831234fe738a091a5a4caf325811c1b5b`, SHA archive `c1b5fcd558902a50aa90c19bfd5286ecb29f8ba8e4b6d0e60b361da8abe74e49`.
2. `IMPORT_IN_REPO.py` sur clone propre → branche `codex/xartists-sites-v3-exact`.
3. Commit exact : `4b2026d` (751 fichiers `apps/frontend`).
4. Commit hébergement distinct : `73099d5`.
5. Bundle : `xartists-sites-v3-exact.bundle` (4.2 Mo) dans l’environnement agent pour push manuel.

### Non fait / bloqué

* `git push` HTTPS : pas de credentials agent → **les 751 fichiers ne sont pas encore sur GitHub** (seule la branche pointe encore sur un tip proche de main + ce doc).
* `npm install` incomplet ici (502 registry WalletConnect) → build Vite **non exécuté**.
* Scripts `check-routes` / `verify-site` / `run-render-check` : **non exécutés**.
* Comparaison visuelle navigateur / téléphone / xPortal réel : **non exécutée**.

### Push recommandé (machine avec auth GitHub)

```bash
# Option A — depuis le clone local qui a les commits 4b2026d + 73099d5
git push -u origin codex/xartists-sites-v3-exact

# Option B — unbundle puis push
git clone https://github.com/Neltud/xArtists.git && cd xArtists
git fetch origin
git checkout -B codex/xartists-sites-v3-exact
git bundle unbundle /chemin/xartists-sites-v3-exact.bundle
git push -u origin codex/xartists-sites-v3-exact
```

Puis :

```bash
cd apps/frontend
npm install --legacy-peer-deps
npm run build
node scripts/check-routes.mjs
node scripts/verify-site.mjs
node scripts/run-render-check.mjs
```

## Vérifications et limites

La version publiée Sites a passé son build Vite et les contrôles de routes / traductions / rendus côté Sites. Ces contrôles serveur ne remplacent pas une validation visuelle WebGL, un essai tactile téléphone ni une approbation réelle xPortal.

Le dépôt peut contenir des erreurs TypeScript héritées : un build Vite réussi ne signifie pas que `tsc --noEmit` est globalement sans erreur.

Examiner les différences métier avec `main` avant fusion. Aucune fusion automatique dans `main`.
