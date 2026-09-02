# Séparation stricte : LIA protocole × sous-agents propriétaires

## Deux mondes

| | **LIA (xArtists / Vellum protocole)** | **Sous-agent propriétaire** |
|--|--------------------------------------|-----------------------------|
| Wallet | PEM LIA ops (`erd1p4zy…`) | Wallet **user** (Connect) |
| Book | Pyramides LIA 15/15/20… | `agent_stakes` par `agent_id` + owner |
| Live flag | `LIA_LIVE_TRADING` | `agent_live` sur le stake (défaut 0) |
| Clés API | N/A protocole | Hash-only, scopes read-only |
| Objectif | Yield / arb / board protocole | Service vendu au buyer |
| Seller on-chain | LIA peut lister ses packs | Créateur peut lister les siens |

LIA **crée / provisionne** le sous-agent (factory Vellum) mais **ne mélange pas** les fonds de départ user avec le book protocole.

GreenSmoke = signaux externes ≠ packs agents marketplace.

## Paiement on-chain

`agents_marketplace` encore **null** → buy/list **bloqués** jusqu’au deploy + codeHash.
