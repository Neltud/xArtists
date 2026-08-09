# Micro-preuves on-chain (MultiversX mainnet)

Module : `lia/security/onchain_micro_proof.py`

## Commandes

```bash
# Vérifier une TX existante
PYTHONPATH=. python -m lia.security.onchain_micro_proof verify <txHash64>

# Vérifier + écrire data/micro_proof_log.json
PYTHONPATH=. python -m lia.security.onchain_micro_proof register <txHash64>

# Re-vérifier tout le journal
PYTHONPATH=. python -m lia.security.onchain_micro_proof refresh

# Statut log + go_live_gates
PYTHONPATH=. python -m lia.security.onchain_micro_proof status

# Dry-run self-transfer (défaut)
PYTHONPATH=. python -m lia.security.onchain_micro_proof execute-self

# Broadcast réel (PEM requis)
export PEM=/path/mainnet.pem
export LIA_MICRO_PROOF_EXECUTE=1
PYTHONPATH=. python -m lia.security.onchain_micro_proof execute-self --send
```

## Règles sécurité

| Règle | Détail |
|-------|--------|
| Status | `success` on-chain |
| Cap value | ≤ 0.05 EGLD (env `MICRO_PROOF_MAX_WEI`) |
| User ≠ LIA ops | preuve user ne peut pas être le wallet protocole |
| Execute | `LIA_MICRO_PROOF_EXECUTE=1` + PEM — pas le flag trading live |
| LIVE trading | toujours `go_live_gates` + preuves + SC codeHash |

## Parcours recommandé xArtists

1. Wallet **user** : micro List/Buy ou self-transfer après deploy SC  
2. `register <txHash>` → `proof_micro_on=true`  
3. Optionnel LIA ops : `execute-self --send` (0.001 EGLD)  
4. `status` jusqu’à `PASS_MINIMAL`  
5. Seulement ensuite envisager `LIA_LIVE_TRADING=1`  

Ne pas enregistrer des TX tiers aléatoires comme preuves produit.
