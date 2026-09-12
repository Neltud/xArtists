# GrokyversX + Hatom — policy

1. **Lending first** — supply only if market not at liquidity cap  
2. **Collateral** — enterMarkets before borrow  
3. **Borrow** — only if health factor buffer ≥ policy (default: no borrow under 1 EGLD equity)  
4. **Booster** — stake HTM only after verified booster SC + size ≥ min  
5. **Withdraw** — redeem / redeemUnderlying before rebalancing  

Failed mint 2026-09-12: HTM market **liquidity cap** — wait or use another market (e.g. supply EGLD micro if strategy allows).
