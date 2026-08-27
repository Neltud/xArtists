# GitHub Pages rebuild

## Workflow

**Principal :** `.github/workflows/deploy-pages.yml`  
- Trigger : `push` sur `main` (paths `apps/frontend/**`, `data/**`, `docs/**`, …) **ou** `workflow_dispatch`  
- Build Vite → copie `dist/` dans `docs/` → `404.html` = `index.html` (SPA) → push `docs/` → Deploy Pages

## Vérifier

1. https://github.com/Neltud/xArtists/actions  
2. Run **Deploy xArtists dApp to GitHub Pages** — doit être vert  
3. Si bloqué : **Actions → workflow → Run workflow** (manuel)

## URLs après deploy

- https://neltud.github.io/xArtists/
- https://neltud.github.io/xArtists/entity  (besoin 404.html SPA)
- https://neltud.github.io/xArtists/sim

## Si `/entity` renvoie 404

Ancien deploy sans `404.html`. Relancer le workflow après le fix SPA.

## Note

`pages.yml` est **disabled** (dispatch only). Ne pas confondre avec `static.yml` (build racine `npm` — peut échouer si pas de package.json racine).
