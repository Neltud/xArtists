# Vellum ↔ xArtists — frontières

| Élément | Rôle |
|---------|------|
| **Vellum** | Service **payant** externe. Cerveau LIA (workflows, nodes, décisions, exécution ops). |
| **LIA** | Agent développé / orchestré **sur Vellum**. Wallet ops LIA ≠ wallet utilisateur. |
| **GitHub `Neltud/xArtists`** | Corps produit : front Vite, data JSON, SC refs, docs. Vellum **git pull** / s’inspire du repo. |
| **Pages** | https://neltud.github.io/xArtists/ — demo UI |

## Qui fait quoi

1. Grok / CI pousse le **repo** (UI, paper data, specs).
2. **Vellum** met à jour nodes / workflows et pilote LIA (secrets, PEM, live gates).
3. La dApp **ne remplace pas** Vellum : elle expose board paper, packs, market, tours, wallet user.

## Live trading

`LIA_LIVE_TRADING=0` tant que SC + fonds + audit OK. Vellum seule peut lever les gates ops.
