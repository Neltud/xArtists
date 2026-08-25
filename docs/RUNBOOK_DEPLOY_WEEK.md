# Runbook deploy — semaine (P0)

**Objectif :** passer marketplace + agents de `codeHash null` → live vérifié, sans fond utilisateur tant que non verified.

Prérequis secrets (hors git) : `PEM` mainnet, éventuellement `VELLUM_*`.

---

## 0. Wallets treasury (bloquant)

Créer **4** EOA (ou multisig) distincts de LIA Ops :

| Rôle | Usage |
|------|--------|
| Mission | 40 % fees |
| Reserve | 30 % |
| Reward | 20 % |
| Ops | 10 % |

Publier dans `data/contracts.json` → `wallets.mission` / `reserve` / … + `docs/TREASURY_POLICY.md`.

LIA Ops (ne pas utiliser comme Connect user) :  
`erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

---

## 1. Build SC

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0
./scripts/build_scs_isolated.sh all
# ou au minimum nft-marketplace + agents-marketplace
```

---

## 2. Deploy mainnet

```bash
export PEM=/secure/mainnet.pem   # jamais dans le repo

./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
# noter les adresses erd1qqq… renvoyées
```

Optionnel même session : `tro-burn`, `treasury-splitter` (après wallets).

---

## 3. Post-deploy + verify

```bash
python scripts/post_deploy_contracts.py \
  --marketplace erd1... \
  --agents erd1...

python scripts/verify_marketplace_codehash.py
# attendu : codeHash ≠ null, code_empty=false
```

Mettre à jour `data/contracts.json` + mirror `apps/frontend/public/data/`.

---

## 4. Frontend env + Pages

```bash
# apps/frontend .env / CI secrets
VITE_MARKETPLACE_SC=erd1...
VITE_AGENTS_MARKETPLACE_SC=erd1...
# NE PAS activer VITE_SUPERNOVA=1 avant le 10 sept. (sauf test Devnet)

cd apps/frontend && npm ci && npm run build
# push → GH Actions Pages
```

Retirer les banners « not live » **uniquement** si `scStatus` / codeHash verified.

---

## 5. Micro-proofs user

1. Wallet **user** (≠ LIA Ops) : List micro NFT (prix min).
2. Second wallet : Buy.
3. Explorer : status success · fee 3 % (`FEE_BPS=300`).
4. Logger hashes dans notes ops / issue.

---

## 6. Gates sécurité (rester paper LIA)

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
# allow_live_trading=false jusqu’à stabilité paper + micro-proofs
```

---

## 7. Supernova (parallèle, non bloquant deploy)

Voir `docs/SUPERNOVA_TIMEOUTS.md`.

- Avant 10 sept. : laisser flags à 0 sur mainnet.
- Devnet stress : `CHAIN_SUPERNOVA=1` + `VITE_SUPERNOVA=1`.

---

## Abort criteria

- `codeHash` toujours null après deploy → ne pas ouvrir l’UI market.
- Out of gas / deploy fail → `simulate_deploy_mainnet.sh`, monter `GAS_LIMIT` (max protocol).
- PEM exposé → rotate immédiat, jamais commit.

---

*Liens :* `docs/DEPLOYMENT_STEPS.md` · `docs/RUNBOOK_NOW.md` · `docs/STATUS_2026-08-25.md`
