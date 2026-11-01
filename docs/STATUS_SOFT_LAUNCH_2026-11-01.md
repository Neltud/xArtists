# Soft-launch status — 2026-11-01

## Ship log (today)

| PR | Contenu | Statut |
|----|---------|--------|
| #235 | Soft-launch IA: core modules in directory + BottomNav 5 hubs | **MERGED** |
| #236 | Hero Packs/Museum/LIA + Shell desktop/dock/search core | **MERGED** |
| #234 | tailwindcss root 3→4 | MERGED (root only; **apps/frontend stays 3.4**) |
| #233 | eslint 8→10 | **OPEN — do not merge** |

## Soft-launch perimeter (visible)

Musée · Packs · Marché · LIA paper · Studio · Wallet · essentials  
Lab modules: routes OK, hidden unless `?lab=1` or `localStorage xa_show_lab=1`.

## Gates

| Gate | State |
|------|--------|
| S0 governance (CODEOWNERS, env production on SC jobs) | VERT |
| Soft-launch UX browse | VERT on main |
| LIA live trading | **0** (paper) |
| Commercial PayBox | **NO-GO** until real smoke + My Packs NFT |
| Micro-preuve A (buyPack) | **READY — operator run only** |

## Next operator action (blocking S1 proof)

1. https://github.com/Neltud/xArtists/actions/workflows/mint-test-buypack.yml  
2. Run workflow → `confirm_mainnet` = `MINT_TEST_MAINNET`  
3. Approve Environment **production**  
4. Journal: `docs/OPERATOR_CARD_MICRO_PROOF_A.md`

## Dependabot policy

Majors blocked for: eslint, tailwindcss, vite, vitest, @typescript-eslint/*  
Migration = dedicated PR, never auto-merge.

## UX backlog (post soft-launch)

1. Fusion pages orphelines (~22)  
2. PageGuide on core routes only  
3. Intent bar limited to soft-launch intents  
4. Archive `_legacy`  
