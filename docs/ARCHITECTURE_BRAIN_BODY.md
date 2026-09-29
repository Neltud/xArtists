# Architecture Cerveau / Corps — xArtists

## Diagramme 1 — Flux décision (Akash + Front)

```
[ MONDE RÉEL ]          [ LE CERVEAU (Akash) ]          [ LE CORPS (Frontend) ]
      |                         |                            |
      | (Data Sociale/Grok)     |                            |
      V                         |                            |
[ GROK (Analyse) ] ----> [ LIA (Décision) ]                |
      |                         |                            |
      | (Sentiment Hype/Crash)  |                            |
      V                         V                            |
[ FASTAPI (Orchestrateur) ] ----> [ WEBSOCKET ] --------> [ UI / CSS shaders ]
      |                         |      (Flux continu)       | (Lumière / Couleur)
```

### Implémentation front (actuel)

| Couche | Module |
|--------|--------|
| Bus pulse | `lib/brainStream.ts` |
| Hook | `hooks/useBrainMood.ts` |
| Bandeau | `components/BrainMoodStrip.tsx` |
| Corps visuel | `ArtAtelierBackdrop` + CSS vars `--brain-*` |

### Env optionnels

```
VITE_BRAIN_WS=wss://your-akash-orchestrator/ws
VITE_BRAIN_HTTP=https://your-akash-orchestrator/pulse
```

Sans env → simulateur paper local (random walk sentiment).

Payload WS/HTTP attendu :

```json
{ "mood": "hype|crash|calm|alert|neutral", "score": 0.42, "note": "…" }
```

## Diagramme 2 — Achat / mint user

```
[ UTILISATEUR ]         [ FRONTEND (React) ]        [ MULTIVERSX ]
      |                         |                            |
      | Clique Acheter          |                            |
      V                         V                            |
[ INTERFACE UI ] ----> [ SDK xPortal ] ----------------> [ SMART CONTRACT ]
      |                 (Signature)                       (Validation)
      |                         |                            |
      |                         | <--- Event Success --------+
      |                         V                            |
[ FEEDBACK VISUEL ] <--- [ empireStore / TxShell ] <---------+
```

### Modules

| Étape | Module |
|-------|--------|
| UI | PackCheckout, Marketplace, StakingPage |
| Signature | TxShell `__xartistsSendTx`, xPortal WC |
| SC | tro_staking, marketplace, venue, slot… |
| Store | `empireStore` phase TX + `empireTxSuccess` |
| Feedback | TransactionOverlay, PackOpenTheater, HolderRoom |

## Règles

- Pas de PEM dans le navigateur.
- LIA / Grok **décident** (paper ou signaux) ; **l’utilisateur signe** les fonds.
- CODEHASH fail-closed sur chaque SC live.
