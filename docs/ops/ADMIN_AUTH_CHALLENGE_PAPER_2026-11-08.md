# Challenge admin paper (2026-11-08)

**Statut :** préparation offline. Pas d'endpoint HTTP. Pas de session cookie. Pas de privilège.

## Module

`apps/frontend/src/lib/adminAuthChallenge.mjs`

```text
issue({ admin, action, ttl, …fields })
  → { nonce, message canonique, issuedAt, expiresAt }

consume({ nonce, admin, action })
  → one-shot ; replay / expiry / mismatch → refus
```

Store **en mémoire** uniquement. Une implémentation durable (Postgres `UNIQUE(nonce)` + `consumed_at`) devra remplacer `Map` avant tout usage réel.

## Flux cible (non branché)

1. Serveur émet challenge (après auth session distincte).
2. Client signe `message` via wallet (`MessageComputer` path).
3. Serveur : parse message → UserVerifier → `consume(nonce)` atomique.
4. Seulement alors : enfiler une intention d'action owner/attestor (toujours sous multisig pour les fonds).

## Tests

`node --test apps/frontend/tests/admin-auth-challenge.test.mjs`

## NO-GO

Ne pas exposer `/admin/challenge` tant que :
- store durable + anti-replay,
- vérif MessageComputer,
- allowlist admin ≠ adresse collée,
- rate-limit + audit log,
- owner SC = multisig.
