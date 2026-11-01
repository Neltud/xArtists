# Operator Card — Micro-preuve Variante A (buyPack on-chain)

**Statut Sprint 0** : VERT  
**Prérequis** : Environment `production` + required reviewers · `SC_DEPLOYER_PEM` scoped  
**Workflow** : `Mint test buyPack Pulse` (`.github/workflows/mint-test-buypack.yml`)  
**LIA** : paper only — ne pas toucher `VITE_LIA_LIVE_TRADING`

## Ce que fait le workflow (automatique)

1. Gate : `confirm_mainnet` doit être exactement `MINT_TEST_MAINNET`  
2. setPackPrice Pulse → **0.01 EGLD** (atomic `10000000000000000`)  
3. buyPack@01 au prix test → NFT sur **deployer**  
4. Restore setPackPrice Pulse → **1 EGLD** (`if: always()`)  
5. Vérifie présence NFT `XAIPLS*` sur deployer + prix restauré  
6. Cleanup PEM  

## Procédure opérateur (toi)

1. Ouvre https://github.com/Neltud/xArtists/actions/workflows/mint-test-buypack.yml  
2. **Run workflow**  
3. Inputs :
   - `confirm_mainnet` = `MINT_TEST_MAINNET`  
   - laisser defaults SC / prices  
4. Approuve le déploiement **Environment `production`** (reviewer)  
5. Attends la fin du job (~2–5 min)  
6. Remplis le journal ci-dessous + `data/sprint1_microproof_journal.md`  

## Journal (à coller après run)

| Champ | Valeur |
|-------|--------|
| Date UTC | |
| Workflow run URL | |
| buyPack tx hash | |
| NFT identifier | |
| Prix test atomic | `10000000000000000` (0.01 EGLD) |
| Prix restored | 1 EGLD (vérifier log) |
| Balance SC agents avant | |
| Balance SC agents après | |
| Operator | @Neltud |
| Environment approval | oui / non |

Explorer SC : https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg

## Critères de succès Variante A

- [ ] Job vert  
- [ ] NFT `XAIPLS*` sur deployer  
- [ ] Pulse price = 1 EGLD après restore  
- [ ] Journal + screenshots  
- [ ] LIA toujours paper  

## Si échec

- Balance deployer insuffisante → fund micro EGLD puis re-run  
- Environment secret manquant → vérifier `SC_DEPLOYER_PEM` sur Environment `production`  
- Prix non restauré → relancer manuellement setPackPrice 01 → 1e18  

## Variante B (plus tard)

PayBox 50 € + IPN + My Packs — **obligatoire** pour GO commercial (Sprint 2).  
Variante A seule = preuve technique SC, pas preuve commerciale fiat.
