---
hidden: true
noIndex: true
---

# Publication GitHub Pages — source unique

**Workflow canonique (seul publisher Vite voulu) :** `.github/workflows/static.yml` — *Deploy Vite app to GitHub Pages* (source `apps/frontend/dist` → archive `_site`). Il valide la présence de toutes les entrées HTML et la publication du **SHA exact**.

**Réglage GitHub Pages indispensable :** dans [Settings → Pages](https://github.com/Neltud/xArtists/settings/pages), **Build and deployment → Source = GitHub Actions**, jamais **Deploy from a branch / main /docs**.

Le 4 novembre 2026, le workflow GitHub généré **`pages-build-deployment`** a effectivement publié `./docs` sur le commit `fddcadc`, après le run Vite vert `b1f732ba`. Le public a reçu l'ancien `source_sha=0483ecd4`. Diagnostic, preuves et correction : [issue #362](https://github.com/Neltud/xArtists/issues/362) et [procédure Pages](PAGES_REBUILD.md).

**Vérifications** : `static.yml` après déploiement ; `pages-live-watchdog.yml` périodique, **lecture seule** ; `release-stamp-ci.yml` sur PR. Un `[skip ci]` ne doit jamais faire republier un dossier `docs/` périmé.

**Deprecated, pas de publication :** `pages.yml` · `jekyll-gh-pages.yml` · `deploy-frontend.yml` · `deploy-exclusive.yml` · `deploy-pages.yml`. Ces workflows historiques ne doivent pas devenir un second publisher.

Cette correction concerne exclusivement la visibilité du front public : aucun checkout PayBox, mint live, bridge, trading ni déploiement de contrat autorisé.
