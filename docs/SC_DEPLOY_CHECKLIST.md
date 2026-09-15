# SC deploy checklist (ops)

**Status today:** product SCs **NOT_DEPLOYED** (`codeHash` null).  
**SoT:** `data/contracts.json` · `docs/SOURCE_OF_TRUTH.md`

## 0. Probe (no PEM required)

```bash
python3 scripts/ops_sc_status.py
python3 scripts/ops_sc_status.py --json
# CI-style:
python3 scripts/ops_sc_status.py --strict   # exit 2 while empty
```

## 1. Preflight (PEM on operator host only)

```bash
export CHAIN=1
export PROXY=https://gateway.multiversx.com
export PEM=/secure/deployer.pem          # never git
export FEE_BPS=300

./scripts/preflight_deploy_mainnet.sh all
# builds wasm via build_scs_isolated.sh, checks balance ≥ ~0.25 EGLD
```

## 2. Deploy order (mainnet)

From `contracts/README.md`:

```bash
./scripts/deploy_mainnet.sh agents-marketplace   # first if ready
./scripts/deploy_mainnet.sh nft-marketplace
# or:
./scripts/deploy_mainnet.sh
```

**Do not deploy** `btc-bridge` (experimental).

Incomplete cargo-only (staking): do not treat as production until build+tests exist.

## 3. Post-deploy verify

```bash
python3 scripts/post_deploy_verify.py
python3 scripts/ops_sc_status.py --strict   # should pass when codeHash set
```

Update `data/contracts.json`:
- addresses if changed
- `deploy_status.* = "DEPLOYED"`
- only then relax UI claims beyond GO_DEMO

## 4. Frontend env (after verify)

- `VITE_MARKETPLACE_ADDRESS` / agents address
- integrityGates must see non-null codeHash

## 5. Log

Append TX hashes + explorer links to `DEPLOYMENT_LOG.md`.

## Gas note

Supernova ~600ms rounds — still budget gas limits from preflight output.
