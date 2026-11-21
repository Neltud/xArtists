# Pipeline auth admin offline (2026-11-08)

**NO-GO production / HTTP / privilege.**

## Flux prouvé hors ligne

```
createAdminChallengeStore.issue
  → message canonique (adminAuthMessage)
  → Message + MessageComputer + UserSecretKey (SDK)
  → UserVerifier.fromAddress
  → store.consume (one-shot)
```

Module : `apps/frontend/src/lib/adminAuthPipelineTest.mjs`  
Tests : `apps/frontend/tests/admin-auth-pipeline.test.mjs`

## Store durable (candidat)

`services/access-api/migrations/admin_auth_challenges_v1.sql`

- Non appliqué en prod
- `nonce` PRIMARY KEY
- TTL ≤ 10 min
- `consumed_at_ms` pour anti-replay

Remplacement futur de la `Map` mémoire : `INSERT` à l'émission, `UPDATE … WHERE consumed_at_ms IS NULL AND expires_at_ms > $now RETURNING *` à la consommation.

## Toujours bloqué avant GO

1. Migration DB explicitement approuvée + tests Postgres éphémères
2. Endpoint HTTP avec session authentifiée (pas d'adresse collée)
3. Allowlist admin / multisig owner
4. Audit log + rate limit
5. VM escrow + politique multisig SC
