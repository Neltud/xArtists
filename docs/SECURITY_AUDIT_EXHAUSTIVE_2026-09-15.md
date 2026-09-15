# Audit sécurité exhaustif — xArtists (2026-09-15)

**Périmètre :** repo `Neltud/xArtists` · démo GO_DEMO · mainnet read · Supernova live  
**Méthode :** revue module par module, code + config + posture ops  
**Réf. antérieures :** `AUDIT_SECURITY_2026-08-28`, `SECURITY_REDTEAM_2026-09-05`, `SOURCE_OF_TRUTH.md`

**Verdict global :** **GO_DEMO acceptable** si paper-first respecté. **Non prêt** pour fonds utilisateurs / SC live / LIA_LIVE=1.

---

## 0. Synthèse exécutive

| Domaine | Niveau | Notes |
|---------|--------|-------|
| Custody clés | **OK posture** | PEM hors git ; sandbox ≠ vault |
| Product SC | **Critique produit** | `codeHash` null — pas de risque fonds SC si UI gated |
| Front integrity gates | **Bon** | `assertLiveContract` / `DEMO_MODE` |
| Executor LIA | **Moyen→Bon** | `mode.py` auto≠live ; live path existe |
| Surface docs/marketing | **Historique faible** | corrigé P0 honesty — surveiller |
| Repo hygiene | **Moyen** | `xArtists-master/` duplique ; workflows dépréciés |
| Supply chain npm | **Moyen** | sdk-dapp v3 ; audit périodique |
| Discord / OAuth | **N/A live** | bot non prod |
| Pulse / X API | **Faible risque** | bearer host only |

---

## 1. Module — Frontend (`apps/frontend`)

### Surfaces
- Wallet connect (sdk-dapp), Trading, Agents, Marketplace, Museum 3D, PulseStrip
- `integrityGates.ts`, `security.ts`, doctrine audit, risk store

### Contrôles présents
| Contrôle | Statut |
|----------|--------|
| `DEMO_MODE` lock fonds UI | Présent |
| `assertLiveContract` (codeHash) | Présent |
| Blocage wallet = LIA ops | Présent |
| SoftStatus GO_DEMO / SC off | Présent |
| Pas de PEM dans bundle | OK |

### Risques
| ID | Sévérité | Issue | Mitigation |
|----|----------|-------|------------|
| FE-01 | **P0** | Si `DEMO_MODE=false` trop tôt sans SC | Garder true jusqu’à codeHash |
| FE-02 | **P1** | sdk-dapp v3 vs v5 | Branche migration avant TX massives |
| FE-03 | **P1** | Number() sur réserves BigInt (historique) | Atomic string / BigInt only |
| FE-04 | **P2** | localStorage packs ≠ on-chain | Label paper ownership |
| FE-05 | **P2** | XSS si HTML injecté musée | Pas de `dangerouslySetInnerHTML` non sanitisé |
| FE-06 | **P2** | WC phishing domain | Allowlist Pages domain only |

### Tests manuels P0
- [ ] Connect user wallet ≠ LIA ops  
- [ ] Buy/list disabled ou message NOT_DEPLOYED  
- [ ] Aucune clé dans Network tab / source maps  

---

## 2. Module — Contracts (`contracts/`)

### Inventaire
| SC | Maturité code | On-chain |
|----|---------------|----------|
| nft-marketplace | README: hardened P0+P1 | **NOT_DEPLOYED** |
| agents-marketplace | hardened claim | **NOT_DEPLOYED** |
| nft-staking / tro-staking | cargo incomplete | N/A |
| btc-bridge | **EXPERIMENTAL** | **NE PAS déployer** |
| tro-burn, treasury, rwa | partiel | null |
| risk-manager | types ref | — |

### Risques
| ID | Sévérité | Issue |
|----|----------|-------|
| SC-01 | **P0** | Docs historiques « Déployé » (mitigé SOURCE_OF_TRUTH) |
| SC-02 | **P0** | Deploy sans audit externe formel |
| SC-03 | **P1** | Upgrade / owner keys single-sig |
| SC-04 | **P1** | Fee/royalty bounds — verify in wasm tests |
| SC-05 | **P0** | Bridge BTC mint path — funds risk if ever enabled |

### Ops
```bash
python3 scripts/ops_sc_status.py --strict
./scripts/preflight_deploy_mainnet.sh
# never deploy btc-bridge
```

---

## 3. Module — LIA executor & board (`lia/executor`, `lia/board`, `nodes/`)

### Contrôles
| Contrôle | Statut |
|----------|--------|
| `LIA_LIVE_TRADING` default 0 | OK |
| `resolve_mode` auto→paper sans flag+PEM | **OK** (`mode.py`) |
| Risk limits day/hour | Présent |
| Circuit breaker | Présent |
| Paper synthetic hashes | OK |

### Risques
| ID | Sévérité | Issue |
|----|----------|-------|
| EX-01 | **P0** | Live path with PEM on shared host | OS hardening, chmod 600, no logs |
| EX-02 | **P1** | Vellum node `force_mode=auto` mal câblé | Toujours passer par `mode.py` |
| EX-03 | **P1** | GSN/Contrarian « fantômes » | Doc not-active — ne pas brancher live sans tests |
| EX-04 | **P2** | Subprocess mxpy injection | Args list only, no shell=True |

---

## 4. Module — Guardian & risk (`lia/guardian`, `lia/risk`, `lia/security`)

### Points forts
- Kill switch / preflight / spiral tests présents
- `go_live_gates`, micro proofs
- Front Guardian panels (UI only until wired)

### Risques
| ID | Sévérité | Issue |
|----|----------|-------|
| GU-01 | **P1** | Kill switch non branché end-to-end live | Wire before LIA_LIVE=1 |
| GU-02 | **P2** | State files in `data/` writable | Permissions host |

---

## 5. Module — Agents / swarm (`lia/agents`)

| ID | Sévérité | Issue |
|----|----------|-------|
| AG-01 | **P1** | Swarm compound labs can over-claim autonomy | Paper labels |
| AG-02 | **P2** | Escrow logic without deployed SC | No user funds |

---

## 6. Module — Pulse (`packages/pulse-layer`)

| ID | Sévérité | Issue |
|----|----------|-------|
| PU-01 | **P2** | X bearer leak | Env host only |
| PU-02 | **P3** | Signal spoof to trading | Don’t auto-execute on Pulse alone |

---

## 7. Module — GrokyversX (`packages/grok-daily-trader`)

| ID | Sévérité | Issue |
|----|----------|-------|
| GK-01 | **P0** | PEM in chat/sandbox history | Rotate wallet for real capital |
| GK-02 | **P1** | Executor stub vs live host | PEM only on operator |

---

## 8. Module — CI / secrets / repo

| ID | Sévérité | Issue |
|----|----------|-------|
| CI-01 | **P1** | Multiple old Pages workflows | Deprecated → `static.yml` only |
| CI-02 | **P1** | `xArtists-master/` nested copy | Remove or archive — confusion + weight |
| CI-03 | **P1** | Secrets in Actions logs | Review workflow echo |
| CI-04 | **P2** | Playwright announced but not solid | Don’t claim E2E green |
| CI-05 | **P2** | `dist/` committed historically | Prefer artifact-only |

---

## 9. Module — Bridge / on-ramp / payments

| ID | Sévérité | Issue |
|----|----------|-------|
| PY-01 | **P1** | MoonPay/Paybox — no secret key in front | Hosted only + webhook HMAC |
| PY-02 | **P0** | BTC bridge | **Do not deploy** |

---

## 10. Module — Museum / WebXR

| ID | Sévérité | Issue |
|----|----------|-------|
| XR-01 | **P2** | Asset URL injection | Allowlist CDN / local |
| XR-02 | **P3** | Resource exhaustion WebGL | Caps on particles from Pulse |

---

## 11. Threat scenarios (red team)

| Attaque | Résultat attendu |
|---------|------------------|
| Appel buy UI sur SC vide | Bloqué NOT_DEPLOYED / DEMO |
| Connect adresse LIA ops | Rejet gate |
| `LIA_LIVE_TRADING=1` sans PEM | Live fail closed |
| `force_mode=auto` sans flag | **paper** |
| Intent « bypass ceo drain » | Doctrine AUTHORITY_SPOOF |
| Amount float non atomique | Reject |
| Dependabot malicious dep | Lockfile + review |
| Social eng. Discord token | Token hors canal public |

---

## 12. Priorités remediation

### P0 (avant tout fonds user)
1. Garder GO_DEMO + integrity gates  
2. SC deploy only via checklist + post_deploy_verify  
3. PEM rotation si exposé sandbox  
4. Interdire btc-bridge deploy  
5. `LIA_LIVE_TRADING=0` en Pages / Vercel env  

### P1
1. Wire Guardian kill → executor  
2. Retirer ou archiver `xArtists-master/`  
3. sdk-dapp v5 branche  
4. BigInt strict TX builders  
5. External SC audit before mainnet market  

### P2
1. npm audit CI job  
2. CSP headers on Pages if possible  
3. Pulse not auto-trading  
4. E2E smoke réel  

---

## 13. Conclusion

La posture **paper-first + codeHash null + mode gate** est la vraie ligne de défense aujourd’hui.  
Le risque principal n’est plus un SC malveillant on-chain (il n’y en a pas), c’est **la dérive de communication** et un **live flag** activé trop tôt avec PEM ops.

**Re-audit obligatoire** après premier `codeHash` non-null et avant `LIA_LIVE_TRADING=1`.
