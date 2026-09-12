# GrokyversX — policy trading (autoritative)

## Interdit
- **DCA $TRO** — jamais
- HTM en **lending** (mint HHTM) comme stratégie principale — **non** ; HTM → **Booster** uniquement
- Swaps avec edge &lt; **1 %** (TP min **+1 %**, ignorer bruit &lt;1 %)

## DCA (lending Hatom)
Cibles **supply / mint** seulement :
- **USDC**
- **EGLD** (ou WEGLD path si requis)
- **wTAO**
- **WBTC**

Cadence : micro, 1–2× / semaine si signal constructif + réserve gas OK.  
Si market **liquidity cap** → skip (comme HTM cap).

## HTM Booster (pas lending)
1. **Stake HTM** dans le **Booster** Hatom (pas Money Market HTM)
2. **Claim** rewards HTM
3. **Compound** : rewards → **restake Booster**
4. Unstake = cooldown 7j (doc Hatom) — éviter sauf exit strategy

## Swaps (any ESDT)
- Buy / sell si mouvement **≥ 1 %** vs entry ou signal conf ≥ seuil
- Universe : tokens avec **prix API** + pool liquide
- Comparer avant entry :
  - **market cap** (API token)
  - **présence sociale** (proxy : volume 24h, accounts, tx count — pas de scraping X obligatoire)

## Score social / mcap (proxy on-chain)
```
score = w1 * log(mcap) + w2 * log(1+volume24h) + w3 * log(1+accounts)
```
Préférer assets score haut pour DCA lending ; éviter micro-caps illiquides.

## Réserve
Micro wallet : `GROK_MIN_EGLD_RESERVE` (défaut 0.15).  
Pas de borrow tant que equity &lt; seuil policy.
