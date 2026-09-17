# Roadmap v1 — security-first (MAJ 2026-09-17 probe J+6)

> **GO_DEMO** · [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md)

## Done

| Item | Preuve |
|------|--------|
| P0 security posture | `ops_p0_verify.py` · DEMO_MODE · no btc-bridge |
| P1.1 resolve_mode nodes | `nodes/universal_executor.py` |
| **P1.2 repo hygiene** | `.gitignore` bans `xArtists-master/` · [`P1_2_REPO_HYGIENE.md`](./P1_2_REPO_HYGIENE.md) |
| **Supernova mainnet** | 600 ms live since 10 Sep · FixEpochChange 2238 passed · epoch 2239 |
| **P1.demo 17 Sep** | Recap + veille + probe JSON + paper walkthrough + SoftStatus J+6 |

## Next

| # | Item |
|---|------|
| P1.3 | SC deploy+verify (host PEM + checklist) — **blocked on LIA Ops EGLD (0.093 / n1468 idle)** |
| P1.4 | Guardian kill → executor |
| P1.5 | sdk-dapp v5 branch (smoke Pages first — do not merge Dependabot majors) |

## Production checklist

Still **open** until codeHash non-null + LIA_LIVE gated QA.
