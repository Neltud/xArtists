# Agent de Voyage

## Produit

Pack thématique **Voyage** (14 € catalogue, corridor 9–22 €) dans `agentPacks.ts`.

- **Rôle** : signaux mobilité, culture, RWA hospitality soft
- **v1** : paper / advisory — **pas** de réservation réelle ni custodie dépôt voyage
- **Données** : `data/voyage_signals.json` + bandeau GSN domaine travel (quand feed live)
- **UI** : `VoyageAgentPanel` sur Dashboard / Agents

## Relation Sovereign (fichiers joints EVM)

Les contrats Solidity joints (`Marketplace_Escrow`, `Sovereign_Governance`, `TRO_Master`) sont une **référence conceptuelle** omnichain / Sepolia — **pas** le chemin mainnet MultiversX xArtists.

### Alertes sécurité (escrow EVM joint)

- `confirmDelivery` + `withdraw` transfèrent `address(this).balance` entier → **risque de drainage multi-listings**
- Pas de mapping buyer / refund propre
- À ne **pas** déployer tel quel en prod

Chemin prod xArtists : SC **Rust MultiversX** (`contracts/agents-marketplace`, etc.) + LIA Vellum paper → micro-live.

## Vellum

LIA peut lire `voyage_signals.json` avec poids max ~10 % et filtre GSN — **jamais** exécution auto v1.
