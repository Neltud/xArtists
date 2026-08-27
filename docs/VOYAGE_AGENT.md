# Agent de Voyage (xArtists)

## Produit

| Couche | Rôle |
|--------|------|
| **Pack NFT `voyage`** | Badge + accès sleeve (list ~14 €) — `agentPacks.ts` / `lia-voyage-01` |
| **GSN agent `Voyage`** | Forecasts travel/culture (accuracy ~82%) — advisory LIA only |
| **UI** | `VoyageAgentPanel` + grille packs 4 colonnes + domaine ✈️ |

## v1 inclus
- Signaux destinations / saisonnalité (paper)
- Corrélation crypto × tourisme (lecture)
- Veille RWA hospitality / culture
- Bandeau / liste GSN domaine `travel`

## v1 exclus
- Booking hôtel / vol réel
- Custodie dépôt voyage
- Assurance voyage

## Lien RWA / escrow (vision)

Les specs EVM `Marketplace_Escrow` (Sepolia) servent de **référence conceptuelle** pour un futur escrow séjour — **pas** le runtime MultiversX actuel. Primauté : SC Rust MVX + paper LIA.

Voir `docs/SOVEREIGN_EVM_REFERENCE.md`.
