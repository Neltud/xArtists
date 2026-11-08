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

## 2026-11-08 — vérification Ed25519 éphémère hors ligne

- `apps/frontend/src/lib/adminAuthSignatureTest.mjs` vérifie une signature Ed25519 de test sur les octets UTF-8 exacts du message canonique.
- `apps/frontend/tests/admin-auth-signature-test.test.mjs` génère des clés éphémères en mémoire et couvre signature valide, modification du message, mauvaise clé, expiration et champs malformés.
- Le parseur refuse désormais les champs dupliqués, valeurs non canoniques, identifiants de litige invalides et dates non entières.
- **Limite de sécurité :** ce vérificateur ne lie PAS la clé publique à une adresse MultiversX bech32 ; le champ admin n'est qu'une chaîne validée. Il ne vérifie ni le contexte exact de signature wallet, ni la session serveur, ni l'anti-replay persistant. Ne jamais l'utiliser pour un endpoint admin ou un privilège propriétaire.
- Commande de test : `node --test apps/frontend/tests/admin-auth-message.test.mjs apps/frontend/tests/admin-auth-signature-test.test.mjs`.
- Prochaine étape : vérifier les vecteurs officiels de signature wallet, décoder l'adresse bech32 avec un SDK audité, comparer la clé publique, valider domaine et chaîne, puis consommer atomiquement le nonce dans un stockage durable avec session authentifiée.
