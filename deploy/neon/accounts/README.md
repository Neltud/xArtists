# Neon Free — routes de comptes xArtists, désactivées

Cette Function porte `POST /v1/account/session` et `GET /v1/account/me` de
l'Access API vers le sandbox existant. Elle réutilise le vérificateur Ed25519,
le repository transactionnel et les projections de profils de `main`.
Le pilote `xartistsauthpilot` et l'API publique restent distincts.

## Contrat

| Route | Méthode | Comportement |
| --- | --- | --- |
| `/health`, `/v1/ops/build-info` | GET, HEAD | SHA de source, sandbox explicite, gates commerciaux toujours OFF. Aucun SQL. |
| `/v1/account/session` | POST sans corps | Après activation contrôlée et JWT Neon vérifié, crée ou retrouve un UUID xArtists. Aucun cookie ni jeton wallet émis. |
| `/v1/account/me` | GET, HEAD | Après activation contrôlée, lit uniquement le profil du sujet signé. Aucun compte créé par lecture. |

Les deux routes de comptes répondent **503 par défaut**. Les origines sont
exactement `https://xartists.art` et `https://www.xartists.art`. Aucun cookie
n'authentifie ces routes ; un Bearer JWT signé et vérifié est requis.
Les requêtes avec paramètres, corps, identité ou identifiant utilisateur
client sont refusées. Une identité désactivée n'est jamais réattribuée.
Une panne SQL ou un schéma absent ferme le service ; aucune identité
pseudonymisée de secours n'est renvoyée comme compte persistant.

## Cible et activation

Cible unique : projet `orange-dust-23862418` (`xartists-access-sandbox`), branche
`br-steep-sun-bab7l93p`, région `aws-eu-central-1`, base `xartists_access`.
Ne pas toucher au projet `xartists-stripe-sandbox`.

Le contrat d'activation requiert simultanément :

- `WALLETLESS_ACCOUNT_SESSION_ENABLED=1` et `WALLETLESS_DATABASE_TARGET_CONFIRMED=1` ;
- les variables Neon de branche et d'Auth correspondant exactement à cette cible ;
- `XARTISTS_ACCOUNT_DATABASE_URL`, avec le rôle dédié `xartists_accounts_app`,
  le hostname **pooler** de cette branche et cette base, et TLS vérifié.

La connexion propriétaire `DATABASE_URL` injectée par Neon n'est pas utilisée.
Aucun rôle ni secret n'est créé par ce lot. Le rôle applicatif devra être
limité aux tables de comptes, sans accès à `paybox_orders`, `mint_jobs` ou
aux tables d'authentification, sans DDL ni écriture wallet/abonnement. Le
repository doit pouvoir lire les liens wallet existants, mais pas en créer.

**Avant toute activation**, restent à faire : revue du schéma et du rôle,
sauvegarde/restauration, migration de la bonne base, quotas et anti-abus,
recette d'une connexion réelle avec un compte consentant. Les tests utilisent
des JWT signés par une clé de test et une base locale jetable, pas un OTP réel.
Le sandbox observé le 20 novembre 2026 ne contient pas les tables `xa_*`.
Ce lot n'applique aucune migration distante et n'active aucun compte public.

## Déploiement isolé OFF

Après CI, bundler `index.mjs` et ses imports en ESM pour Node 24, en gardant le
shim `createRequire` requis par `pg`, puis placer le résultat `index.mjs` à la
racine d'un ZIP. Déployer uniquement le slug **`xartistsaccounts`** dans la
cible ci-dessus, avec `XARTISTS_SOURCE_SHA=<SHA exact de la source>` et les
deux gates à `0`. Ne fournir aucun DSN applicatif à ce déploiement OFF.

Neon fournit les variables de branche et d'Auth au runtime. Ne jamais mettre
de DSN, secret ou JWT dans le bundle, les logs, `VITE_*` ou le dépôt.

Vérifier en HTTPS : health et build-info 200 avec le bon SHA et les gates
fermés ; profil GET et session POST 503 ; méthodes interdites 405 ; origine
étrangère 403 sans réflexion CORS. Le POST de vérification est sans corps et
sans jeton, sur la Function OFF uniquement. La réponse 503 n'est pas une
preuve de connexion utilisateur réussie.

Ne pas remplacer `VITE_ACCESS_API_BASE`, changer le DNS, redéployer Render,
activer le commerce, le mint, le stockage Studio ou le trading avec ce lot.
La Function ne remplace pas l'Access API complète. Aucun abonnement payant
n'est nécessaire ; l'organisation connectée est sur le plan `free`.

## Vérification

```sh
node --test services/access-api/tests/neonAccountApi.test.mjs
XARTISTS_EXPECTED_SOURCE_SHA=<SHA exact> node scripts/ops/probe-neon-accounts-off.mjs
```

Le workflow `neon-account-api-ci.yml` vérifie aussi sur PostgreSQL 16 jetable
la création concurrente idempotente, la persistance, l'isolation entre deux
identités et le refus d'une identité désactivée. Il ne contacte pas Neon.
