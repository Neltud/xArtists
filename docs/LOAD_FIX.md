# Fix chargement — conflit index vs 404

## Cause (2026-08-27)

- `docs/index.html` → `assets/index-CtYXMuxI.js` (**200**)
- `docs/404.html` → `assets/index-CEhbLFWV.js` (**404 fichier manquant**)

Toute navigation deep-link / refresh hors `/` servait le mauvais shell → JS introuvable → « Chargement… » / ErrorBoundary.

## Correctifs

1. `404.html` = même hashes que `index.html`
2. Deploy workflow : `cp -f index 404` **après** data copy + vérification match
3. Service Worker **v4** : HTML en network-first (plus de shell périmé)

## Côté utilisateur

1. Hard refresh **Ctrl+Shift+R**
2. Ou DevTools → Application → Clear storage → Unregister SW
3. Préférer liens hash : `https://neltud.github.io/xArtists/#/agents`
