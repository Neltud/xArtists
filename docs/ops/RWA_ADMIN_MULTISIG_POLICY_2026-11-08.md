# RWA escrow — politique admin multisig (préparation)

**Statut :** préparation uniquement. Pas de déploiement. Pas de signature broadcast.

## Constat code

Le contrat `rwa-escrow-bridge` expose un **owner monolithe** avec :

| Endpoint | Pouvoir |
|----------|---------|
| `setPaused` | Arrêt total |
| `setAttestor` | Change la frontière de confiance |
| `refund` | Rembourse le payer sans les 4 portes (si owner ou deadline) |
| `cancelByOwner` | Annule et rembourse sans les 4 portes |
| `resolveDispute` | Tranche le litige (vendeur ou payer) après cooling 7j |
| `transferOwnership` / `acceptOwnership` | Transfert en **2 étapes** |

Le 2-step ownership est déjà dans le code. Ce n'est **pas** un multisig.

## Politique cible (avant tout GO mainnet)

1. **Owner** = contrat multisig MultiversX (ou adresse institutionnelle à seuil), jamais une clé ops unique.
2. **Attestor** = adresse dédiée distincte de l'owner ; rotation via `setAttestor` sous quorum.
3. Toute action `refund` / `cancelByOwner` / `resolveDispute` / `setAttestor` exige le quorum documenté hors chaîne (runbook + preuves).
4. Interdiction d'utiliser le wallet de déploiement (`erd1kex0…`) comme owner de production.
5. Journal : chaque résolution de litige archive off-chain les 4 hash (receipt, authenticity, quality, ownership) avant signature.

## Auth signée — ce qui manque encore

- Schéma de message signé admin (domaine, nonce, expiry) pour les actions sensibles côté dApp.
- Binding wallet admin ≠ session utilisateur Connect.
- Tests : signature expirée, mauvais domaine, replay nonce.

Sans ces éléments, le front ne doit pas exposer de bouton "résoudre litige" branché sur une clé unique.
