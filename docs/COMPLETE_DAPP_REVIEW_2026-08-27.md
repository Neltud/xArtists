# Revue complète dApp xArtists — 2026-08-27

**Verdict : GO_DEMO** (UI + data live + paper LIA). **NO-GO commerce on-chain** tant que codeHash null.

## Live checks (mesurés)

| Endpoint | HTTP |
|----------|------|
| `/` | 200 |
| `index` / `404` même bundle | OK |
| `entity_map`, `lia_board`, `gsn`, `agents_catalog`, `voyage_agent`, `liquidity_cycle`, `risk_manager`, `live_network` | 200 |

## Modules

| Module | Route | État |
|--------|-------|------|
| Dashboard / Home | `/#/` | UI live + quick actions |
| Entity map | `/#/entity` | 15 succursales |
| Sim Lab | `/#/sim` | UI demo |
| Marketplace | `/#/marketplace` | UI · SC pending |
| Agents packs | `/#/agents` | UI · SC pending |
| **Voyage** | `/#/agents/voyage` | paper UI + JSON |
| Trading / Board | `/#/trading` | paper + live reads |
| Studio / Gallery | `/#/studio` `/#/gallery` | UI |
| Wallet / Tip / DAO / TRO | … | UI + lectures |
| Staking / Hatom / LP | … | UI / externes |
| On-ramp Fiat | ⌘K buy / Home CTA | MoonPay + demo modal |
| Intent ⌘K | global | rules FR/EN |
| Paper Soul / LIA Monitor | global | paper |
| Risk Manager | banner + JSON | paper gate |
| Liquidity orch. | JSON paper | no bridge exec |

## Sécurité

- Pas de PEM / webhook secret en front
- LIA ops wallet ≠ user wallet (guards)
- `LIA_LIVE_TRADING` off
- Marketplace gated codeHash

## P0 suivants (Vellum / ops)

1. Deploy SC marketplace + agents · verify codeHash  
2. Fund LIA ops EGLD ≥ deploy  
3. Micro List/Buy user wallet  
4. Tag `v2.8.0-demo-live` + release notes  
5. Puis seulement micro-live trading  

## Liens

- https://neltud.github.io/xArtists/  
- https://neltud.github.io/xArtists/#/entity  
- https://neltud.github.io/xArtists/#/agents/voyage  
