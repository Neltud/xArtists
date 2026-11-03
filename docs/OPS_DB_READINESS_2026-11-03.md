# xArtists — Preuve de connectivité des commandes (3 novembre 2026)

## Objectif : vérifier la **base réellement joignable**

Le champ `orders_backend=postgres` de `GET /health` indique simplement que
`DATABASE_URL` est défini ; il **ne prouve ni une connexion SQL ni l'existence
du schéma**. La nouvelle route strictement en lecture répond à ce manque :

```text
GET https://xartists-access-api.onrender.com/v1/ops/orders-store/status
```

La route utilise une requête PostgreSQL sans écriture :
`SELECT to_regclass('public.paybox_orders') IS NOT NULL AS table_ready`.
Elle renvoie uniquement trois indicateurs non sensibles :

```json
{"ok":true,"backend":"postgres","table_ready":true}
```

Une base injoignable, un schéma absent ou un stockage fichier renvoient
`HTTP 503`, `ok=false`, `table_ready=false` (backend `postgres` ou `file`).
Le timeout de connexion est de quatre secondes, celui de requête de trois
secondes, et les vérifications sont coalescées/mémorisées pendant 30 secondes
pour limiter la charge sur la base. Les réponses HTTP restent `no-store`.

**Aucun identifiant PostgreSQL, message d'erreur SQL, hostname, commande
d'acheteur, montant ni URL de connexion n'est exposé.** La route ne crée
pas de table, ne lance pas de migration et ne modifie pas les commandes.

## Comment interpréter la preuve

- `/health` JSON OK : processus API démarré — **pas** une preuve DB.
- `/v1/ops/orders-store/status` HTTP 200, `table_ready=true` :
  connexion PostgreSQL réelle et table `public.paybox_orders` visible.
- Ce contrôle ne garantit **pas** que l'utilisateur DB peut écrire,
  que les commandes sont correctes, que Render utilise exactement le
  projet Neon sandbox connecté à ChatGPT, ou que la livraison NFT est réelle.
- `HTTP 503` après plusieurs essais : **NO-GO pour toute création
  de commande**, investiguer la base avant toute activation commerciale.

## Tests et preuves attendues

- Test unitaire du fallback fichier / base inaccessible ; aucune fuite de
  credentials dans les réponses.
- CI PostgreSQL 16 jetable : vérifie d'abord le schéma absent sans migration,
  puis crée une table de **fixture uniquement dans la base jetable** et
  exige `table_ready=true`. Le test refuse explicitement toute base
  non locale ou nom différent de `xartists_mint_probe`.
- Le GO public smoke vérifie désormais cette route et conserve les gates
  `PAYBOX_CHECKOUT_ENABLED=0`, `MINT_DISPATCH_ENABLED=0`,
  `MINT_DRY_RUN=1`, `MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0`.

## Critères de lancement toujours bloqués

Le diagnostic DB ne prouve **aucun paiement S1, IPN signé réel, mint mainnet,
NFT livré au bon acheteur ou remboursement**. Les travaux sont suivis dans
[issue #281](https://github.com/Neltud/xArtists/issues/281).

Ne pas utiliser de PAT GitHub exposé précédemment : il doit être révoqué côté
GitHub ; il a été effacé de Render. Ne pas activer les paiements, le mint,
le trading ni le bridge TRO en réponse à une simple disponibilité API/DB.
