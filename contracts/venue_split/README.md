# SC venue-split (draft audit-ready)

**Statut :** draft · **pas de deploy mainnet** avant checklist GO_LIVE + revue externe.

## Objectif

Recevoir un paiement de location d’espace d’exposition et le répartir de façon **immuable** :

| Bucket | % | Endpoint |
|--------|---|----------|
| Institution | 40 | adresse configurée au deploy |
| Associations | 20 | adresse configurée |
| LIA treasury | 25 | adresse LIA |
| Holders rewards | 15 | pool rewards SC (ou adresse escrow) |

## Règles de sécurité

- Pas d’upgrade après deploy (code immuable).
- Pas de PEM dans ce repo / front / Akash.
- `owner` uniquement pour **pause d’urgence** optionnelle (ou zéro admin si purement immuable).
- Montants en EGLD natif + ESDT (USDC) via endpoints séparés.
- Reject si somme des bps ≠ 10_000.

## Fichiers

- `src/venue_split.rs` — logique MultiversX (cadre Rust / mx-sdk style).

## Alignement front

Voir `apps/frontend/src/config/venueRental.ts` et `treasuryFlows.ts` (`venue_rental`).

## GO_LIVE

1. Audit
2. Deploy testnet → verify
3. Deploy mainnet → `VITE_*` seulement après codeHash OK
4. Annonce publique
