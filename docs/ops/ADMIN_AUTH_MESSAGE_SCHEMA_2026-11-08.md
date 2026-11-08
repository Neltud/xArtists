# Auth admin signée — schéma v1 (paper)

**Statut :** préparation. Aucune signature live, aucune clé, aucun broadcast.

## Module

- `apps/frontend/src/lib/adminAuthMessage.mjs`
- Tests : `node --test apps/frontend/tests/admin-auth-message.test.mjs`

## Message canonique

```
xArtists.admin.v1
chainId=1
action=<resolveDispute|setAttestor|setPaused|refund|cancelByOwner|transferOwnership>
admin=<erd1… signer>
contract=<erd1…|\->
escrowId=<id|\->
favorSeller=<0|1|\->
target=<erd1…|\->
nonce=<opaque ≥8 chars>
issuedAt=<ms>
expiresAt=<ms>
```

Contraintes :

- TTL max 10 minutes
- domaine fixe `xArtists.admin.v1`
- chainId mainnet `1` uniquement dans ce schéma
- `resolveDispute` exige `favorSeller` + `escrowId`
- anti-replay : nonce consommé côté serveur (store)

## Séparation des rôles

| Rôle | Usage |
|------|--------|
| Session utilisateur Connect | List / Buy utilisateur |
| Admin message | Actions owner/attestor sensibles |
| Multisig on-chain | Owner du SC (voir politique RWA) |

Le front **ne doit pas** proposer `resolveDispute` tant que :

1. le message est construit via ce schéma,
2. la signature est vérifiée serveur (Ed25519 MultiversX),
3. le signer = owner multisig ou rôle délégué documenté,
4. le nonce n'est pas rejoué.

## Hors périmètre actuel

- Vérification crypto de signature (nécessite SDK + clés de test éphémères)
- Endpoint HTTP admin
- Binding session cookie
