# Migration Postgres — admin_auth_challenges_v1

**Fichier :** `services/access-api/migrations/006_admin_auth_challenges_v1.sql`  
**Store :** `services/access-api/src/adminAuthChallengeStore.mjs`  
**Tests :** `services/access-api/tests/admin-auth-challenge-pg.test.mjs`

## Statut

| Action | Autorisé |
|--------|----------|
| Lecture / revue SQL | oui |
| Test sur Postgres éphémère (`ADMIN_AUTH_TEST_DATABASE_URL`) | oui |
| Application auto Neon / prod | **NON** |
| Endpoint HTTP admin | **NON** |
| Privilège SC / multisig | **NON** |

## Application manuelle (ops uniquement)

```bash
# environnement de test isolé seulement
export ADMIN_AUTH_TEST_DATABASE_URL=postgres://…
psql "$ADMIN_AUTH_TEST_DATABASE_URL" -f services/access-api/migrations/006_admin_auth_challenges_v1.sql
cd services/access-api && node --test tests/admin-auth-challenge-pg.test.mjs
```

Consommation atomique :

```sql
UPDATE admin_auth_challenges_v1
SET consumed_at_ms = $now
WHERE nonce = $1 AND admin_bech32 = $2 AND action = $3
  AND consumed_at_ms IS NULL AND expires_at_ms > $now
RETURNING *;
```

## Ordre avant GO

1. Tests PG verts sur instance éphémère
2. Pipeline MessageComputer + consume store
3. Session authentifiée ≠ adresse collée
4. Multisig owner SC
5. Approbation opérateur explicite pour toute base non-éphémère
