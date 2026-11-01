# Soft-launch status — 2026-11-01

## Ship log

| PR / event | Contenu | Statut |
|------------|---------|--------|
| #235 | Soft-launch IA: core modules + BottomNav 5 hubs | **MERGED** |
| #236 | Hero Packs/Museum/LIA + Shell core nav | **MERGED** |
| Micro-preuve A | mint-test-buypack run 41309878814 | **VERT** |
| #234 | tailwindcss root 3→4 | MERGED (frontend stays 3.4) |
| #233 | eslint 8→10 | **OPEN — do not merge** |

## Micro-preuve A (on-chain)

| Field | Value |
|-------|--------|
| Run | https://github.com/Neltud/xArtists/actions/runs/41309878814 |
| buyPack | `dbe2b96f7616f55652b1d68f4193c25c70044f12562315a1f141c97840ca271c` |
| NFT | `XAIPLS-2cf72b-03` / `04` |
| Pulse price after | **1 EGLD** |
| Journal | [data/sprint1_microproof_journal.md](../data/sprint1_microproof_journal.md) |

## Gates

| Gate | State |
|------|--------|
| S0 governance | VERT |
| Soft-launch UX | VERT |
| **S1 micro-preuve A (SC buyPack)** | **VERT** |
| S1 micro-preuve B (PayBox fiat) | OPEN |
| LIA live | **0 paper** |
| Commercial GO | **NO-GO** until B + legal S2 |

## Next

1. Variante B: 1 ordre Sentinel 50€ PayBox + IPN + My Packs NFT  
2. S2 legal stubs published  
3. Close #233 (eslint major)  
4. Dependabot major guards (if not merged)  

**Doctrine**: paper LIA · soft-launch perimeter · no commercial claims without B.
