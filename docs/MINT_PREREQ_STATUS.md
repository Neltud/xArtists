# Mint live — audit prérequis (2026-11-02 ~13:25 CET)

## Verdict

| Prérequis | Status | Détail |
|-----------|--------|--------|
| `SC_DEPLOYER_PEM` env **production** | ⚠️ **non vérifiable via API** | Secrets GitHub ne se lisent pas en externe — à confirmer UI : Settings → Environments → production → Secrets |
| Deployer = owner collections / SC | 📍 `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` | SC owner + collection owner XAIPLS/XAIYLD/XAISNT |
| EGLD deployer | ❌ **0.005342 EGLD** | **Insuffisant** pour buyPack Rule1 (15–33 EGLD) |
| Admin | 0.136 EGLD · **0** pack NFT | `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` |
| LIA wallet | 0.908 EGLD · 0 pack NFT | `erd1p4zyy…0crn6` |
| Prix SC on-chain | ⚠️ **1 / 5 / 2.5 EGLD** | **≠ Rule1** 33 / 22.5 / 15 |
| NFTs déjà mintés (owner) | 2× Pulse | `XAIPLS-2cf72b-03` · `XAIPLS-2cf72b-04` |
| Type collection | NonFungibleESDT | NFT (pas Meta-ESDT SFT) sur explorer |

## Actions bloquantes (ordre)

1. **Confirmer secret** `SC_DEPLOYER_PEM` sur environment `production` (GitHub UI).
2. **Financer le deployer** (recommandé ≥ **40 EGLD** pour un Pulse + gas, ou ≥ **20 EGLD** pour Sentinel seul).
   - OU lancer mint en **`micro_price=true`** (0.001 EGLD temp) puis restore Rule1 — voir workflow.
3. **Aligner prix SC → Rule1** après funding (workflow le fait sur chaque live mint / restore admin).
4. Dispatch **Mint on payment** avec `buyer=erd1…` + `confirm=LIVE_MINT_MAINNET`.

## Seuils EGLD (atomic)

| Mode | Pulse | Yield | Sentinel | Gas marge |
|------|-------|-------|----------|-----------|
| Rule1 catalogue | 33 | 22.5 | 15 | ~0.05 |
| Micro (ops) | 0.001 | 0.001 | 0.001 | ~0.05 |

Deployer actuel **0.005** → **seul micro_price** est viable sans top-up.

## Suite produit (indépendant funding)

- Wire IPN → `workflow_dispatch` mint
- TCA Whop `prod_`
- My Packs lit déjà on-chain via `matchOnChainPacks`
