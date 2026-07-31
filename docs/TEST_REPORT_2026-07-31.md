# Test Report — 31 juillet 2026

## Résumé

| Domaine | Résultat |
|---------|----------|
| Strategies | PASS (après fix) |
| Guards G01–G17 | PASS |
| Compound engine | PASS |
| Multi-horizon | PASS |
| Asset policy TRO | PASS |
| Guarded cycle | PASS |
| DApp static | OK (React/Vite/sdk-dapp v0.6.0) |

## Bug corrigé

**`lia/circuit/strategies.py` → `momentum_regime`**

- Avant : `price_spike` non défini → `NameError`
- Après : conf basée sur `price_change_1h` + `volume_spike`

## Fee model vérifié

Notional $50 → fees ≈ **1,2 %** · gross requis pour +1 % net ≈ **2,2 %**

## Commande

```bash
python tests/test_lia_circuit.py
```

## DApp (non exécuté offline)

```bash
npm ci && npm run build
npx playwright test
```

Pages : dashboard, marketplace, trading, portfolio, dao, agents, hatom.
