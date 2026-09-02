# Agent de voyage

## Produit

| Couche | Contenu |
|--------|--------|
| Pack NFT | `voyage` — list ~14 €, intensity 2 |
| Catalogue | `lia-voyage-01` (pending SC deploy) |
| GSN | Agent **Voyage** — DEST_LISBON, RWA_HOSPITALITY, CULTURE_FLOW |
| UI | `VoyageAgentPanel` sur `/agents` |

## v1 scope

- Signaux destinations / saisonnalité (paper)
- Corrélation crypto × tourisme (lecture)
- Veille RWA hospitality / culture
- Bandeau GSN domain travel

## v1 NOT

- Booking hôtel/vol réel
- Custodie dépôt voyage
- Assurance voyage

## LIA / Vellum

Traiter `TRAVEL_SIGNAL` comme sleeve advisory dans la fusion de signaux (poids plafonné comme GSN), **jamais** exécution booking.
