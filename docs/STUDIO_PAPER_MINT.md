# Studio paper mint E2E

Parcours:

1. `#/studio` étapes 1–3 (collection, média, metadata)
2. Étape 4 → **Mint paper · certificat local**
3. Entrée dans `localStorage` (`xartists_studio_paper_mints_v1`)
4. Event `lia-intent` type `STUDIO_MINT_PAPER` → journal 8008
5. Si `VITE_VELLUM_8008_WEBHOOK` → proxy → Vellum workflow

On-chain mint = ops mxpy / SC après GO_LIVE (pas de PEM dans le front).
