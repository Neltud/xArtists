# Pages /offres et diagnostic mint_jobs — 2026-11-03

**État :** préparation de correctif CI ; statut HTTP de chaque
URL à vérifier après déploiement. Aucun encaissement / mint / migration
de base n'est autorisé par cette procédure.

## Contact / DNS (#341)

| Contrôle | Preuve / conclusion |
| --- | --- |
| `xartists.art` A/MX/NS, Google DNS | `NXDOMAIN`, Status 3 |
| `hello@xartists.art` | Pas de réception prouvée, ne pas l'utiliser |
| `https://neltud.github.io/xArtists/#/offres` | Lien SPA de secours (`/#/offres`) |
| `https://neltud.github.io/xArtists/offres/` | Entrée HTML prévue par Vite ; contrôler en HTTP après publication |
| `https://neltud.github.io/xArtists/offres` | Lien sans slash signalé **404** par contrôle Grok indépendant ; ne pas supposer un HTTP 200 |
| `https://xartists-services-and-products.onrender.com/xArtists/offres` | Alternative frontend Render, vérifier le contenu public |
| Checkout / mint live | **Désactivés** sur `/health` |

L'accès provisoire aux demandes de présentation est un
[formulaire GitHub public](https://github.com/Neltud/xArtists/issues/new?template=commercial-introduction.yml).
GitHub exige une connexion ; **ne jamais poster PII, téléphone, email,
wallet, clés, numéros de commande ou œuvres confidentielles**.

## Cause technique démontrée dans le code

La source `apps/frontend/public/404.html` existe, mais **ce n'est
pas elle qui fournit le 404 final du build** :

1. Le plugin Vite `apps/frontend/scripts/publicAvailability.mjs`
   crée des entrées statiques `dist/offres/index.html`,
   `dist/offers/index.html` et un **`dist/404.html`
   spécifique** avec redirection `?_xa_route=...`.
2. `apps/frontend/src/lib/publicRoutes.ts` sait récupérer
   `?_xa_route=...` et `/#/offres` pour le `BrowserRouter`.
3. Avant ce correctif, `.github/workflows/static.yml` copiait
   `_site/index.html` **par-dessus** `_site/404.html` lors
   de la préparation Pages. Cela détruisait la logique de récupération,
   malgré la présence de la source.
4. Le correctif supprime cette copie et **exige** `_site/404.html`
   contenant `_xa_route` et `noindex`. Un test frontend
   échoue si la copie écrasante revient.

La récupération par 404 est une **redirection exécutée dans le navigateur** ;
elle ne transforme pas magiquement le code HTTP initial 404 en 200.
Pour un lien de campagne HTTP 200, privilégier l'entrée
`/offres/` **lorsque le smoke public de déploiement est vert**.
Sinon, utiliser `/#/offres` et ne pas promettre la prise en charge
du chemin sans slash.

Même après des CI vertes, la disponibilité publique doit être constatée
sur le déploiement du commit précis et le formulaire accessible aux
utilisateurs connectés.

## Vérification post-déploiement (lecture seule)

- [ ] Workflow `Deploy Vite app to GitHub Pages` vert après le commit.
- [ ] `_site/offres/index.html` et `_site/offers/index.html`
  restent préconstruits par Vite (OG/canonical distincts).
- [ ] Le smoke `https://neltud.github.io/xArtists/offres/`
  retourne HTTP 200 avec assets attendus.
- [ ] Essayer `/offres` en navigateur : une récupération JS
  peut fonctionner même si l'HTTP initial retourne 404.
- [ ] `/#/offres` fonctionne en navigateur ; la page affiche
  les avertissements de confidentialité GitHub et non le mail mort.
- [ ] Render et GitBook alignés au SHA fusionné, s'il y a déploiement.
- [ ] `paybox_checkout_enabled=false`, `mint_live_enabled=false`
  toujours confirmés.

## `mint_jobs` — issue #281, lecture seule

```
GET /v1/ops/orders-store/status
→ 200 { ok:true, backend:"postgres", table_ready:true }

GET /v1/ops/mint-jobs-store/status
→ 503 { ok:false, backend:"postgres", table_ready:false }
```

Les deux sondes opèrent sur le `DATABASE_URL` de l'API Render
et les résultats observés indiquent que le backend Postgres est
joignable pour les commandes, **sans prouver** l'existence
ou les privilèges de `public.mint_jobs`.

Seul un opérateur **sur le DSN effectivement configuré sur Render**
peut confirmer l'état détaillé sans exposer la chaîne de connexion :

```sql
SELECT current_database() AS db,
       current_schema() AS schema_in_use,
       to_regclass('public.mint_jobs') AS mint_jobs_table;

SELECT table_schema, table_name
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'mint_jobs';

-- Seulement si table existante, par opérateur autorisé :
SELECT has_table_privilege(current_user, 'public.mint_jobs', 'SELECT')
         AS can_select,
       has_table_privilege(current_user, 'public.mint_jobs', 'INSERT')
         AS can_insert;
```

Ce contrôle ne requiert **aucun** `SELECT *`, `INSERT` ni secret
dans un issue. Un résultat null peut signifier table absente ou
invisible selon rôle/search_path ; la décision est à prendre après
comparaison privée du DSN, revue de la migration
`services/access-api/sql/mint_jobs.sql`, sauvegarde/rollback
et approbation opérateur. **Ne pas appliquer automatiquement la migration
sur production à partir d'un simple HTTP 503.**

## Gates inchangées

**GO** : catalogue, musée, demandes publiques prudentes, CI,
sondes read-only et documentation.

**NO-GO** : PayBox checkout public, mint live, issuer `claimPack`,
déploiement SC testnet sans analyse #328, trading live, bridge TRO,
certification d'authenticité automatique.
