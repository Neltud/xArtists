# Sprint GO — Audit d'avancement

**Horodatage:** 2026-11-02 20:33 CET  
**Tip main:** `eee78a85` · **release** `0.129.1`  
**Open PRs:** 0

---

## 1. Ce qui est livré (merged aujourd'hui)

| PR | Domaine | Effet |
|----|---------|--------|
| **#258 / #259** | Mint + IPN wire | dry_run default · dispatch post-IPN · runbook |
| **#268–#273** | Studio + Marketplace | Collection artiste · IPFS upload **OFF** · UX V3 |
| **#270 / #272** | RWA physical | Shopify fulfillment **OFF** · receipts |
| **#274 / #275** | CI | access-api lockfile · `npm ci` strict |
| **#276** | Types | TS global **strict / baseline 0** |
| **#277** | $TRO | Portail `/tro/sale` · bridge Solana **disabled** |
| **#278** | Pages | Single deploy owner · TRO deep-links |
| **#279** | Release | **0.129.1** |

Signaux / matrix / mint hardening : **sur main** (`MODULE_LIVE_MATRIX`, `signals`, `mintDispatch`).

---

## 2. Smoke Pages (HTTP)

| URL | Status |
|-----|--------|
| `/xArtists/` | **200** |
| `/xArtists/packs/sentinel/` | **200** |
| `/xArtists/tro/sale/` | **200** |
| `/xArtists/finance/tro/sale/` | **200** |

---

## 3. On-chain (inchangé — blocker liquidité catalogue)

| Ressource | Valeur |
|-----------|--------|
| Deployer | **0.005342 EGLD** |
| LIA | **0.907888 EGLD** (paper) |
| SC prices | Pulse **1** · Yield **5** · Sentinel **2.5** |
| Rule1 cible | 33 / 22.5 / 15 |

→ Catalogue Rule1 **NO-GO liquidité**.  
→ Premier mint live possible seulement en **`micro_price`** + PEM + buyer.

---

## 4. Matrice produit (GO / NO-GO)

| Surface | Code | Runtime prod | GO commercial |
|---------|------|--------------|---------------|
| Packs IA landings + 3D | ✅ | Pages 200 | **NO-GO** jusqu'à S1+S2 |
| PayBox → IPN → mint dispatch | ✅ | à confirmer env | dry_run only |
| LIA signals / status | ✅ | JSON + API | **GO lecture** · trade **OFF** |
| Command / Museum / Playlist | ✅ | Pages | **GO UX** |
| $TRO discovery portal | ✅ | Pages 200 | **GO lecture** · bridge **OFF** |
| Studio media IPFS | ✅ | **OFF** défaut | NO-GO sans Pinata+PG |
| Physical Shopify | ✅ | **OFF** défaut | NO-GO sans secrets Shopify |
| Solana TRO bridge | ✅ status | **disabled** | NO-GO structurel |
| Whop TCA Membership | ⏳ | — | besoin `prod_` |
| LIA live trading | ❌ | flag 0 | **NO-GO** |

---

## 5. Sprint GO — ordre d'exécution restant

### P0 — Runtime (ops)
1. Confirmer deploy **access-api** prod  
   ```
   MINT_DISPATCH_ENABLED=1
   MINT_DRY_RUN=1
   MINT_LIVE_ENABLED=0
   LIA_LIVE_TRADING≠1
   ```
2. `GET /health` → `mint_dry_run:true`, `signals_daily:true`, `tro_solana_bridge:off`
3. Optionnel: dry-run IPN sandbox → job `mint_jobs` idempotent

### P0 — Preuve chaîne (humain)
4. PEM production confirmé (UI, jamais chat)
5. Buyer `erd1`
6. Actions **Mint on payment** Sentinel · `micro_price=true` · `LIVE_MINT_MAINNET`
7. Explorer: NFT buyer + restore prix SC

### P1 — Commercial packs
8. **S1** paiement réel PayBox Sentinel 50€
9. **S2** My Packs montre NFT
10. Whop TCA `prod_` (services only, no Genesis)

### P1 — Créateurs (optionnel, gated)
11. `CREATOR_MEDIA_UPLOAD_ENABLED=1` seulement avec Pinata+Neon+JWT
12. Premier mint artiste **signé wallet** (pas backend)

### P2
13. Top-up deployer ≥20 EGLD → abandon micro path / align Rule1 SC
14. Physical Shopify secrets + 1 flux test non-commercial

---

## 6. Décision (20:33 CET)

| Gate | Verdict |
|------|---------|
| Code / CI / Pages UX | **GO** |
| Signaux LIA | **GO** (paper) |
| Deploy API dry mint | **GO ops** (à vérifier) |
| Mint mainnet auto | **NO-GO** |
| Mint mainnet micro manuel | **GO si PEM+buyer** |
| Commercial public packs | **NO-GO** sans S1+S2 |
| Bridge Solana / LIA trade | **NO-GO** |

**Aucune transaction mainnet exécutée dans cet audit.**
