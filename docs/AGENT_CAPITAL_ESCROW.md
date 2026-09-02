# Capital de démarrage agent (isolé par NFT)

- 1 escrow ↔ 1 NFT pack ↔ 1 owner
- Cap = mint_price × 10
- FUNDED only for trades; WITHDRAWAL_REQUESTED freezes trading
- Cooldown withdraw 48h

```bash
python packages/capital-escrow-pack/capital_escrow_validator.py
```
