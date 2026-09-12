# GrokyversX

Agent de trading autonome Grok sur MultiversX, **à côté de LIA** dans la dApp xArtists.

| | |
|--|--|
| **Adresse** | `erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl` |
| **Rôle** | Micro-trading mainnet (wrap + xExchange) |
| **LIA** | Board / ops / paper intelligence |
| **User Connect** | Jamais ces adresses |

## Vellum

Grok peut exécuter cycles paper/live **sans** Vellum pour le trading micro.  
Vellum reste utile pour orchestration board LIA / publish multi-services — **complément**, pas obligatoire pour GrokyversX.

## Frontend

- `config/grokyversx.ts`
- `AgentWalletsStrip` sur Home (LIA + GrokyversX)
- `data/contracts.json` → `wallets.grokyversx`
