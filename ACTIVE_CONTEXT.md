# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-14  
**Branch:** `main`  
**Owner / Ops:** Grok (local Dev/Ops) · Gemini Flash (Lead Architect / Audit) · LIA (Vellum Trading & Curation)

---

## 1. On-chain status (agents-marketplace)

| Item | Value |
|------|--------|
| SC address | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Owner | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| Admin wallet | `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` |

### Collections (mainnet live)

| Pack | Enum | Collection | Official price |
|------|------|------------|----------------|
| Pulse | `0x01` | `XAIPLS-2cf72b` | 1 EGLD |
| Yield | `0x02` | `XAIYLD-987e24` | 2 EGLD |
| Sentinel | `0x03` | `XAISNT-3d8a6b` | 3 EGLD |

`buyPack` mints 1 NFT to `msg.sender`. Roles `ESDTRoleNFTCreate` granted on SC.

See: `contracts/agents-marketplace/MAINNET_STATUS.md`

---

## 2. Security fixes (audit P0/P1)

**Commit:** `678010c` — *fix(security): tickerToPackId XAIPLS/XAIYLD/XAISNT + DEV-only paper mint in useAgentPackTx*

| Finding | Severity | Status | Remedy |
|---------|----------|--------|--------|
| S-01 Tickers mismatch (`xAiAx` vs mainnet) | P0 | ✅ Resolved | `DEFAULT_PACK_COLLECTIONS` → XAIPLS / XAIYLD / XAISNT + prefix matching |
| S-02 localStorage paper access bypass | P0 | ✅ Resolved | `loadOwnedPacks` / `markPackOwned` / `mintPaper` gated to `import.meta.env.DEV` only; `holderAccess` chain-only |
| S-04 holderStatus paper grant | P1 | ✅ Resolved | `paper: []` in production; access = on-chain NFTs + admin whitelist |

Frontend gates: `nftPacks.ts`, `holderAccess.ts`, `AgentAccessSync.tsx`, `useAgentPackTx.ts`, `nftService.ts`, `PackCheckout.tsx`.

---

## 3. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops local | Code, workflows, SC scripts, RAG pipeline, build validation |
| **Gemini Flash** | Lead Architect / Audit | Architecture review, security dimensions, consistency checks |
| **LIA (Vellum)** | Trading & Curation | Wallet trading LLM, pedagogical curation (ATC→TCA), persona professors |

---

## 4. RAG pipeline (ATC → TCA)

- Source: `knowledge/rag/atc_transcripts/`
- Curation output: `knowledge/rag/lia_curation/`
- Workflow: `.github/workflows/rag-ingestion.yml` (push on `knowledge/rag/**` + manual)
- Consumer: `lia/tca/rag_engine.py` + optional webhook `RAG_INGEST_WEBHOOK_URL`

---

## 5. Price re-evaluation (treasury LIA / Vellum)

- Workflow: `.github/workflows/update-pack-prices.yml` (manual `workflow_dispatch`)
- Function: `setPackPrice` args `0x01|0x02|0x03` + atomic EGLD amount
- Purpose: adjust pack prices to fund LIA Vellum trading wallet without redeploy

---

## 6. Quick links

- dApp: https://neltud.github.io/xArtists/
- Repo: https://github.com/Neltud/xArtists
- Explorer SC: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg
