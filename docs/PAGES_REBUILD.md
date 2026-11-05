---
hidden: true
noIndex: true
---

# Publication GitHub Pages — procédure canonique (4 novembre 2026)

> **Source d'exploitation uniquement, pas de GO commercial.** Ne pas exécuter les anciens workflows `deploy-pages.yml`, `pages.yml` ou `jekyll-gh-pages.yml` et ne pas générer ni pousser un bundle Vite dans `docs/`.

## P0 — Désactiver le second publisher GitHub Pages

GitHub peut créer automatiquement un workflow **`pages-build-deployment`** lorsque **Settings → Pages → Build and deployment → Source** est sur **Deploy from a branch (main /docs)**. Ce job publie `./docs` **sans reconstruire Vite** ; il peut donc écraser le site plus récent publié par `.github/workflows/static.yml`.

**Preuve du 4 novembre 2026 :** le workflow Vite [41703343498](https://github.com/Neltud/xArtists/actions/runs/41703343498) a publié le commit `b1f732ba` le 3 novembre. Un second workflow automatique [41751366674](https://github.com/Neltud/xArtists/actions/runs/41751366674) a ensuite archivé **`path: ./docs`** et republié ce répertoire sur le commit `fddcadc`, laissant publiquement `build-info.json.source_sha=0483ecd4` (2 novembre), `/auction/` en 404 et un chargement CSS TRO défaillant. Voir [incident #362](https://github.com/Neltud/xArtists/issues/362).

### Correctif GitHub Admin (non automatisable par le connecteur courant)

1. Aller dans [Settings → Pages](https://github.com/Neltud/xArtists/settings/pages).
2. Changer **Build and deployment → Source** en **GitHub Actions**, **jamais** `Deploy from a branch / main /docs`.
3. Garder **un seul owner de production :** [`.github/workflows/static.yml`](https://github.com/Neltud/xArtists/blob/main/.github/workflows/static.yml). Ce workflow construit `apps/frontend/dist`, assemble `_site/`, publie via `actions/upload-pages-artifact` puis `actions/deploy-pages`.
4. Après revue indépendante et CI vertes des PR de publication, utiliser [Actions → Deploy Vite app to GitHub Pages → Run workflow](https://github.com/Neltud/xArtists/actions/workflows/static.yml) (branche `main`) pour republier le build. Aucun paiement, mint, bridge, ordre ou contrat n'est lancé.
5. Comparer le SHA **effectivement servi** à `https://neltud.github.io/xArtists/build-info.json` avec le SHA du run Vite publié. Tester aussi les liens directs `/auction/`, `/marketplace/`, `/tro/sale/`, `/offres/`, ainsi que les assets JS/CSS. Un workflow vert **sans ce contrôle SHA ne prouve pas** que la bonne version est publique.
6. Vérifier après un push de données `[skip ci]` que le build Vite n'est **pas** écrasé par `docs/` ; le watchdog lecture seule `pages-live-watchdog.yml` le vérifie périodiquement après son merge.

**Ne pas contourner le problème** en copiant les bundles compilés dans `docs/`, en relançant un second workflow ou en modifiant le DNS. Une PR CI verte ne change pas le paramètre Pages Source.

## Garde-fous

- `static.yml` : tests de routes statiques, publication unique, **assertion post-deploy `build-info.json.source_sha == GITHUB_SHA`** (ajout PR #361).
- `pages-live-watchdog.yml` : contrôle read-only, toutes les 4 h et manuel, compare SHA public au dernier déploiement Vite réussi ; ne publie rien.
- `release-stamp-ci.yml` : tests hors ligne de la cohérence du manifeste Release Please et des barrières Pages.
- `PAYBOX_CHECKOUT_ENABLED`, `MINT_LIVE_ENABLED`, `LIA_LIVE_TRADING` et bridge TRO restent désactivés jusqu'à une approbation commerciale distincte.
