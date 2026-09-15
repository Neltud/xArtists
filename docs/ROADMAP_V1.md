# Roadmap v1 — security-first (MAJ 2026-09-15 soir)

> **GO_DEMO** · SoT [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md)  
> Audit : [`SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md`](./SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md)  
> P0 addendum : [`SECURITY_AUDIT_P0_ADDENDUM_2026-09-15.md`](./SECURITY_AUDIT_P0_ADDENDUM_2026-09-15.md)

## P0 — DONE / en place

| # | Item | Preuve |
|---|------|--------|
| 0.1 | DEMO_MODE | `demoMode.ts` = true · `ops_p0_verify.py` |
| 0.2 | SC probe | `ops_sc_status.py` |
| 0.3 | PEM discipline | docs ops · never git |
| 0.4 | Block btc-bridge | `DO_NOT_DEPLOY.md` · deploy refuse |
| 0.5 | GO_DEMO docs | SOURCE_OF_TRUTH · SoftStatus |

```bash
python3 scripts/ops_p0_verify.py   # must exit 0
```

## P1 — suivant

1. Wire `resolve_mode` into `nodes/universal_executor.py`  
2. Remove/archive `xArtists-master/`  
3. SC deploy+verify when funded (checklist)  
4. Guardian kill → executor  
5. sdk-dapp v5 branch  

## P2 / P3

E2E réel · Pulse host · Discord bot · staking only after wasm mature · no GSN live until wired  

## Production checklist

Toujours **non cochée** tant que codeHash null + LIA_LIVE=0.
