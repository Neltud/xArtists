# CEO Status — Protocol v2.1 (2026-10-01)

## ✅ [FIX] listNft ABI 3 args
- **Statut :** DONE (code). BLOCKED on user Success TX after Pages rebuild.
- **Détails :** `listNft(price, royalty_bps, royalty_receiver)`. Ancien payload 2 args → `wrong number of arguments`.
- **Impact UX :** Relancer List ALISTOR après hard refresh + xPortal live.
- **Risque :** Faible (NFT non déplacé sur TX fail).

## ✅ [ROUTES] Shell HashRouter
- **Statut :** DONE for product paths. Lab pages exist but are not public nav.
- **Live :** `/` `/museum` `/marketplace` `/agents` `/my-packs` `/slot` `/staking` `/wallet` `/studio` `/command-center` `/trading` `/portfolio` `/tro` `/lia` `/market` `/dao` `/venues` `/go-live` `/legal` `/identity` `/gallery`
- **Alias :** `/command` `/packs` `/salles` `/mentions-legales`
- **Risque :** Moyen si on expose 20 pages lab (Ads, Hatom, Soul…) sans QA.

## ⚠ [GAPS] Produit encore ouvert
| Lacune | Détail | Bloquant go-to-hub ? |
|--------|--------|----------------------|
| 1er listNft Success | Pas encore confirmé explorer | Oui pour index marketplace |
| Index listings | JSON statique vide jusqu’au 1er list | Non (UI grille owner OK) |
| Mint collection Studio | Studio = list owned + paper packs, pas issueNonFungible SC | Non |
| Agents mint on-chain | Paper checkout ; SC agents LIVE mais front paper-first | Non |
| xPortal session | Soft-connect interdit ; QR requis | Non si user reconnecte |
| Slot MODE REAL | House 0.5 EGLD ; secret CODEHASH | Prudence |
| MX-8004 identity | Page existante, registry public non | Non |
| Holo Phase 9 | Bloqué jusqu’à list Success | Oui par protocole |
| Music / 3D polish | Moteur là, QA navigation murs | Non |
| Legal SIRET | Page legal ; siège FR à confirmer humain | Com |

## Contrats MAINNET (ne pas fund les legacy)

| SC | Status fichier | Usage front |
|----|----------------|-------------|
| nft_marketplace …8txmm | LIVE | list/buy — ABI 3 args |
| tro_staking …pe3xf3 | LIVE | stake/unstake |
| slot_casino …s4g34f | LIVE | spin (house 0.5) |
| venue_split | LIVE | rentPay |
| agents_marketplace | LIVE | mint paper-gated |
| treasury_splitter | LIVE | split |
| tro_governance | LIVE | vote si LP |
| nft_staking | LIVE | |
| agent_stake_escrow | LIVE | |

LIA trading = **paper**. Pas un fonds.

## Access
- `AgentAccessSync` monté App + main.
- Admin `erd1mmh2…nucj5l` = tous packs.
- Command Center : `AgentIA_Guard` + modal Access Denied.

## Phase 9
Bloquée tant que listNft ≠ Success explorer.
