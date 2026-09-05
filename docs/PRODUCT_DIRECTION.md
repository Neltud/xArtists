# Direction produit xArtists (dApp démo)

> Document de pilotage — 2026-09-02

## Positionnement

**xArtists** = galerie NFT MultiversX + packs agents IA (Pulse · Yield · Sentinel) + visites culturelles (Galerie 3D / Tours).

- **Mode public** : soft launch **paper** — pas de trading live, pas de market on-chain tant que SC non vérifiés.
- **Honnêteté** : fail-closed (pas de faux « live »).
- **Public cible** : collectionneurs, curieux crypto-art, early adopters MultiversX — **pas** un dashboard ops LIA.

## Cœur produit (5 écrans)

| Route | Rôle |
|-------|------|
| `/` | Accueil calme — CTA Galerie / Packs / Tours |
| `/museum` | **Galerie unique** 3D (Explorer · Ma collection · Carte) |
| `/agents` | Packs Pulse · Yield · Sentinel + comparatif |
| `/wallet` | Portefeuille utilisateur |
| `/tours` | Carte destinations artistiques |

Secondaires utiles : `/marketplace` (catalogue), `/my-packs`, `/trading` (paper), `/legal`.

**Lab** (préfixe menu) : Sim, Soul, Burnify, Hatom… — hors parcours démo.

## Ce qui n’est PAS la Home

- Checklists Zapier / posts X ops
- Blocs codeHash / adresses SC
- Pastilles Board / Guardian / GSN feed
- Jargon Catzligue / Mydee

Ces éléments restent en **mode ops** (`DEMO_MODE=false`) ou pages Lab.

## Paiements

- Packs : Stripe (session API ou Payment Link) → intention paper / mint ultérieur
- On-ramp EGLD : MoonPay
- Paybox FR : `VITE_PAYBOX_PAYMENT_URL` + backend signé (voir `docs/PAYBOX_INTEGRATION.md`)

## Live on-chain (plus tard)

1. Deploy + verify marketplace & agents SC
2. `VITE_MARKETPLACE_CODEHASH_OK=1` / `VITE_AGENTS_CODEHASH_OK=1` **uniquement après verify**
3. Puis seulement : list/buy/mint réels

## Déploiement

- Source : `main` → GitHub Actions `static.yml` → Pages
- Site : https://neltud.github.io/xArtists/
- Si le live montre encore l’ancienne Home saturée : hard refresh + vérifier le run Actions vert sur le dernier SHA `main`.

## Prochaines priorités

1. **Aligner le live** sur `main` (rebuild Pages)
2. Backend Paybox si paiement carte FR requis
3. Polir salle 3D (mobile, zoom)
4. SC deploy/verify — hors chemin critique démo paper
