# Roadmap v1 — security-first (MAJ 2026-09-15)

> **Statut produit : GO_DEMO**  
> **SoT :** [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md) · `data/contracts.json`  
> **Audit sécu :** [`SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md`](./SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md)

## Phase actuelle — GO_DEMO (sécurisé)

| Pilier | État |
|--------|------|
| UI paper + integrity gates | Actif |
| SC product on-chain | NOT_DEPLOYED |
| LIA live trading | OFF |
| Supernova réseau | LIVE (epoch 2237+, 600 ms) |
| sdk-dapp | v3 (migration v5 planifiée) |

## Roadmap ordonnée (sécurité d’abord)

### P0 — Ne pas casser la ligne de défense
| # | Item | Owner |
|---|------|--------|
| 0.1 | Maintenir DEMO_MODE / SC off banners | front |
| 0.2 | `ops_sc_status.py` avant tout deploy | ops |
| 0.3 | PEM hors git / hors Discord | ops |
| 0.4 | Interdire deploy btc-bridge | ops |
| 0.5 | Docs = GO_DEMO only | all |

### P1 — Fondations live (quand prêt)
| # | Item | Dépendances |
|---|------|-------------|
| 1.1 | SC marketplace + agents deploy + verify | PEM, gas, checklist |
| 1.2 | Update `contracts.json` post codeHash | 1.1 |
| 1.3 | Guardian kill → executor wire | LIA |
| 1.4 | Executor live QA (micro EGLD) | 1.3, mode.py |
| 1.5 | sdk-dapp v5 branche + CI | front |
| 1.6 | Retirer `xArtists-master/` | repo |

### P2 — Produit & qualité
| # | Item |
|---|------|
| 2.1 | E2E smoke réel (Playwright installé + CI) |
| 2.2 | Pulse host + X bearer (pas auto-trade) |
| 2.3 | Discord bot `/status` `/analyse` (token secret) |
| 2.4 | Museum WebXR polish + allowlist assets |
| 2.5 | npm audit job |

### P3 — Expansion (après P1)
| # | Item |
|---|------|
| 3.1 | NFT staking / TRO gov si wasm mature |
| 3.2 | On-ramp fiat (hosted, webhook HMAC) |
| 3.3 | GSN / Contrarian **seulement** si tests + wire réel |
| 3.4 | Bridge BTC redesign or permanent kill |

## Checklist « production complète » (bar projet)

- [ ] LIA ≥1 live trade/day gated — **non**  
- [ ] Marketplace list+buy on-chain — **non**  
- [ ] codeHash non-null + SOURCE_OF_TRUTH updated — **non**  
- [ ] Guardian E2E kill — **non**  
- [ ] External SC audit — **non**  
- [ ] E2E CI green — **non**  
- [ ] sdk-dapp v5 — **non**  

## Interdits roadmap

- Libellés PRODUCTION_MAINNET sans codeHash  
- LIA_LIVE=1 pour marketing  
- Auto-trade depuis Pulse seul  
- Deploy experimental bridge  
