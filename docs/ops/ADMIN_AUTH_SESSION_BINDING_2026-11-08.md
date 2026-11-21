# Session binding admin (paper)

**Module :** `services/access-api/src/adminAuthSessionBinding.mjs`

## Règle

Aucune émission de challenge admin si :

- pas de `sessionId` serveur,
- méthode `paste` / `paste_readonly`,
- admin hors allowlist,
- session expirée,
- admin demandé ≠ admin de session.

## NO-GO

Pas de route HTTP, pas de cookie prod, pas de privilège SC.
