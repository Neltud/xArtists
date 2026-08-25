# Supernova timeouts — patch xArtists

**Date :** 25 août 2026  
**Contexte :** MultiversX Supernova Devnet LIVE (600 ms) · mainnet activation **10 septembre 2026**.

> « Every timeout and deadline you tuned to the six second clock is about to be off by 10x. »  
> — @CodeMultiversX, 24 août 2026

**Ce qui ne change pas :** adresses, contrats, ABIs, appels SDK, gas limits (même machines / mêmes frais bas).

**Ce qui change :** intervalles de **polling** TX status & nonce, et timeouts globaux de wait.

---

## Flag unique

| Couche | Variable | Quand |
|--------|----------|--------|
| Node / scripts / LIA | `CHAIN_SUPERNOVA=1` (ou `SUPERNOVA=1`) | Devnet tests **maintenant** · mainnet **à partir du 10 sept.** |
| Frontend (Vite) | `VITE_SUPERNOVA=1` | Idem — rebuild Pages après flip |

Sans flag → mode **pre_supernova** (poll ~3 s TX, nonce ~1.5–2 s) — sûr sur mainnet actuel à 6 s.

---

## Fichiers du patch

| Fichier | Rôle |
|---------|------|
| `src/config/chainTiming.ts` | Source de vérité TS (legacy + services) |
| `apps/frontend/src/config/chainTiming.ts` | Miroir Vite |
| `lia/gas/chain_timing.py` | Defaults Python executor |
| `src/services/txErrors.ts` | `waitTxStatus` → `timingDefaults()` |
| `src/services/nonce.ts` | `waitNonce*` → `timingDefaults()` |
| `apps/frontend/src/pages/MyPacks.tsx` | Poll mint Stripe via `mintStatusPollMs` |

### Table des valeurs

| Paramètre | pre_supernova | supernova |
|-----------|---------------|-----------|
| Round (info) | 6000 ms | 600 ms |
| TX status poll | 3000 ms | 800 ms |
| TX status timeout | 120 s | 45 s |
| Nonce poll | 1500 ms | 500 ms |
| Nonce advance poll | 2000 ms | 600 ms |
| Nonce stable timeout | 45 s | 20 s |
| Nonce advance timeout | 120 s | 45 s |
| Mint webhook poll (UI) | 3000 ms | 1500 ms |
| HTTP fetch timeout | 12 s | 12 s (RTT API) |

**Gas limits** (`useMarketplaceTx`, `useBurnTro`, `lia/gas/mvx_gas.py`) : **inchangés** volontairement.

---

## Checklist ops — 10 septembre 2026

1. Confirmer activation mainnet Supernova (explorer / @CodeMultiversX).
2. CI / secrets : `CHAIN_SUPERNOVA=1` pour jobs LIA / scripts.
3. Frontend : `VITE_SUPERNOVA=1` → rebuild + deploy Pages.
4. Smoke : 1 micro-TX user → confirmation < ~2 s ressentie ; pas de faux timeout.
5. Surveiller rate-limit API MultiversX (poll plus fréquent).

---

## Tests Devnet (avant mainnet)

```bash
# Point app / scripts on Devnet + fast polls
export CHAIN_SUPERNOVA=1
# Vite local
VITE_SUPERNOVA=1 npm run dev --prefix apps/frontend
```

Builders : http://supernova-sprint.xyz/builders
