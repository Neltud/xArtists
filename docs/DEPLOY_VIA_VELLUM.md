# Déployer les SC avec le PEM Vellum

Le PEM **ne doit jamais** être dans le repo GitHub. Il reste un **secret Vellum**.

## Secrets Vellum

| Secret | Description |
|--------|-------------|
| `LIA_WALLET_PEM` | Texte complet du fichier `.pem` |
| `LIA_MVX_PROXY` | `https://gateway.multiversx.com` |
| `LIA_CHAIN_ID` | `1` mainnet (ou `D` devnet) |
| `FEE_BPS` | `300` = 3 % |
| `DEPLOY_CONTRACT` | `all` / `nft-marketplace` / `agents-marketplace` |

## Node Python Vellum

1. Clone ou mount du repo `Neltud/xArtists` sur le runner.
2. `pip install multiversx-sdk-cli` (+ toolchain build wasm si besoin).
3. Code du node :

```python
from lia.vellum.deploy_scs_node import run
print(run())
```

Ou :

```bash
export LIA_WALLET_PEM="$SECRET_PEM"
python lia/vellum/deploy_scs_node.py
```

## Après succès

- Adresses écrites dans `data/contracts.json`
- Commit/push **uniquement** ce JSON (via ton reporter GitHub existant)
- Brancher `marketplace_nft` dans le frontend `VITE_MARKETPLACE_ADDRESS`

## Sécurité

- Ne pas `print` le PEM
- Fichier temp PEM supprimé après deploy
- Préférer un wallet **deployer** avec peu d’EGLD, pas le cold storage
