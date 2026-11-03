# #281 — preuve mint_jobs depuis la base effectivement configurée sur Render

Date : 2026-11-03. **Lecture seule, sans migration, sans commandes ni secrets.**

## API de contrôle

`GET https://xartists-access-api.onrender.com/v1/ops/mint-jobs-store/status`

La route ouvre la connexion PostgreSQL déjà configurée par l'API via `DATABASE_URL` et exécute uniquement :

```sql
SELECT to_regclass('public.mint_jobs') IS NOT NULL AS table_ready;
```

- **200** : `{"ok":true,"backend":"postgres","table_ready":true}`. Prouve une connexion SQL au DSN du service et l'existence de **ce nom de table uniquement**.
- **503** : `{"ok":false,"backend":"postgres","table_ready":false}` si table absente, erreur, ou connexion inaccessible. Backend `file` si `DATABASE_URL` absent.
- Résultats coalescés/cache 30 s, timeout connexion 4 s, requête 3 s, réponse `Cache-Control: no-store`. Aucune migration, aucun `SELECT *`, aucun détail de compte ou URL DB retourné.

**Limite critique :** cette sonde ne prouve pas l'identité du projet Neon, les droits d'écriture, la bonne structure des colonnes, l'idempotence réelle des jobs, la livraison NFT ou les preuves de remboursement. L'opérateur doit comparer le DSN Render à la base du fournisseur **dans son tableau de bord privé, sans le copier**. La liste Render ne montre pas d'instance PostgreSQL managée : une base externe reste possible.

Si `table_ready=false`, suivre `services/access-api/sql/mint_jobs.sql` et les sauvegardes/approuvals DB. **Ne pas auto-migrer en production.** Si `table_ready=true`, vérifier ensuite les contraintes et index par inspection SQL à accès restreint.

CI: PostgreSQL 16 jetable vérifie table absente → aucun DDL à la sonde → table créée uniquement par fixture → sonde devient 200. Tests HTTP vérifient 503 sans fuite de secrets.

**#281 OPEN ; NO-GO PayBox checkout / live mint / claim issuer / trading LIA / bridge.**
