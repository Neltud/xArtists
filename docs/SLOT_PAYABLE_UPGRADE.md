# Slot — upgrade payable (ops)

Probe **8 oct 2026**. Ne pas déployer une nouvelle adresse : la house **0,5 EGLD** est sur le contrat actuel.

## Constat

| | |
|---|---|
| Adresse | `erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f` |
| codeHash | `UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=` (inchangé) |
| EGLD | **0,500000** |
| `isPayable` | **false** |
| `getMinBet` | **0,001 EGLD** |
| `getSpinCount` | 0 (aucun spin résolu) |

Le source (`contracts/slot-casino`) a `#[payable("EGLD")]` sur `spinEgld`. Le **compte** a été déployé sans le bit CodeMetadata payable. Un appel `spinEgld@seed` **avec valeur EGLD** est rejeté par le protocole (`ESDT expected` / `sending value to non payable contract`) avant le RNG. La house ne bouge pas.

Le workflow `deploy-slot-casino.yml` faisait `mxpy contract deploy` **sans** `--metadata-payable`, et crée une **nouvelle** adresse. Ne pas l’utiliser pour « réparer » le slot live.

## Correctif (owner = deployer uniquement)

Même adresse, même storage, flags metadata :

```bash
cd contracts/slot-casino
sc-meta all build
mxpy contract upgrade erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f \
  --bytecode output/slot-casino.wasm \
  --metadata-payable \
  --metadata-upgradeable \
  --metadata-readable \
  --proxy https://gateway.multiversx.com \
  --chain 1 \
  --pem /secure/mainnet.pem \
  --send
```

Vérifier ensuite :

```bash
curl -s https://api.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f \
  | jq '{isPayable,isPayableBySmartContract,codeHash,balance}'
```

`isPayable` doit passer à `true` et le solde rester **0,5 EGLD**. Micro-preuve ensuite : `spinEgld` à **0,001 EGLD** (min bet), pas plus. Tant que ce n’est pas vert, le front garde le mode **Fun** et `spinEgld` UI jette avant signature.

Workflow manuel (ne part pas tout seul) : `.github/workflows/upgrade-slot-payable.yml`  
Confirmation requise : `UPGRADE_SLOT_PAYABLE`.

## Ne pas

- Nouveau `contract deploy` (abandonne la house sur l’ancienne adresse)
- Ouvrir le spin REAL dans le front avant `isPayable: true` + 1 micro-spin success
- Committer le PEM
