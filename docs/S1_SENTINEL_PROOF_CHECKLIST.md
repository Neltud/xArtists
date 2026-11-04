# S1 Sentinel — dossier de preuve exécutable (préparation seulement)

**Édition :** 2026-11-04 · **Issues :** #281, #347, #328 · **Statut : NO-GO commercial, non exécuté**  
**Impact commercial : aucun / lecture seule.** Ni checkout public, ni IPN réel, ni transaction, ni mint, ni migration ni remboursement ne sont déclenchés par ce document.

## 0. Règles de séparation et rôles

- **ChatGPT / CI :** vérifications GET, source, tests locaux hermétiques, captures et dossier de preuves *expurgées*. Aucun secret, aucune signature, aucun ordre de paiement réel.
- **Ops humain :** contrôle privé du PSP et du projet/branche/base réellement associés à Render ; contrôle de privilèges SQL sans lecture d'acheteurs ; éventuelle exécution S1 plus tard et **uniquement** sur ordre distinct signé.
- **Grok/Vellum Architect :** revue indépendante S1, S2, financier, refund et décision GO/NO-GO ; un rapport CI réussi ne donne aucun GO.
- S1 = règlement PayBox vérifié. S2 = NFT mainnet réellement transféré. Livraison = attestation distincte et commit SQL atomique approuvé. **S1 ne vaut jamais S2 et S2 ne vaut jamais livraison.**
- **Jamais** modifier `PAYBOX_CHECKOUT_ENABLED`, `MINT_LIVE_ENABLED`, `MINT_DISPATCH_ENABLED`, `MINT_MICRO_PRICE`, `LIA_LIVE_TRADING`, secrets, PEM, DNS, deployer balance, SC ou bridge dans ce sprint. Aucune commande dans ce runbook n'est une autorisation de lever ces verrous.

## 1. Contrôles READ-ONLY que ChatGPT/Ops peuvent lancer maintenant

Depuis un poste Linux avec `curl` et `jq` et **sans authentifiants** :

    set -euo pipefail
    API='https://xartists-access-api.onrender.com'
    curl -fsS --max-time 30 "$API/health" | jq '{
      ok,service,paybox_mode,paybox_checkout_enabled,
      mint_dispatch_enabled,mint_oidc_pull_enabled,mint_dry_run,
      mint_live_enabled,mint_micro_price,lia_live_trading,tro_solana_bridge
    }'
    curl -fsS --max-time 30 "$API/health" |
      jq -e '.ok == true and .paybox_checkout_enabled == false and .mint_live_enabled == false and .mint_dry_run == true and .lia_live_trading == 0'
    curl -i -sS --max-time 30 "$API/v1/ops/orders-store/status"
    curl -i -sS --max-time 30 "$API/v1/ops/mint-jobs-store/status"

Interprétation : `/health` est un *état de configuration*, pas une preuve PayBox. `orders-store/status` réalise `SELECT to_regclass('public.paybox_orders') IS NOT NULL` et ne démontre que connexion/table. `mint-jobs-store/status` vérifie la table `public.mint_jobs` sur **le DSN de cette API** sans migration. HTTP 503 ou `table_ready=false` = bloquer toute exécution S1 ; ne **pas** créer la table en réponse à un statut public. Les sondes sont coalescées/cache 30 s : horodater chaque observation, noter le SHA déployé indépendamment, ne pas inférer des mesures plus récentes que les réponses.

Vérification publique sans paiement :

    curl -I --max-time 30 https://neltud.github.io/xArtists/packs/sentinel/
    curl -I --max-time 30 https://neltud.github.io/xArtists/offres/

Il s'agit de disponibilité HTTP, **pas** de capacité de checkout ou d'authentification de l'acheteur. Les captures publiques ne doivent contenir ni wallet, ni PII, ni URL de session PayBox.

### Evidence DB privée — seulement l'opérateur autorisé

1. Dans **Render**, identifier le service API, son déploiement exact et la provenance de la variable `DATABASE_URL` via une interface protégée ; ne pas imprimer, copier, hacher publiquement ni consigner le DSN, son hostname, ses accès, ou l'identité d'une base.
2. Dans **Neon**, relever séparément l'identifiant du projet, sa branche, son environnement et son rôle SQL ; vérifier en privé si le DSN Render est bien celui visé. Le projet connu `xartists-access-sandbox` / branche `sandbox` **n'est pas présumé être la production**. Interdire tout test d'écriture tant que cette correspondance n'est pas revue.
3. Avec une session **strictement lecture seule sur la base réellement liée à Render**, faire valider en privé :

       BEGIN TRANSACTION READ ONLY;
       SELECT current_database() AS database_name, current_schema() AS schema_name;
       SELECT to_regclass('public.paybox_orders') AS paybox_orders,
              to_regclass('public.mint_jobs') AS mint_jobs;
       SELECT has_table_privilege(current_user, 'public.paybox_orders', 'SELECT') AS orders_read;
       -- Exécuter la ligne suivante UNIQUEMENT si public.mint_jobs existe :
       SELECT has_table_privilege(current_user, 'public.mint_jobs', 'SELECT') AS jobs_read;
       ROLLBACK;

   **Ne pas** faire `SELECT *`, `INSERT`, `ALTER`, `CREATE TABLE` ou `DELETE` ; les données et le nom de la base restent dans le registre opérateur privé. Un résultat public se limite à « correspondance Render/Neon vérifiée par Ops : oui/non », « tables présentes : oui/non », date, approbateur.
4. Si `mint_jobs` manque, ouvrir **une PR distincte de migration**, revue, sauvegarde et plan de restauration. Voir `services/access-api/sql/mint_jobs.sql` ; ne jamais appliquer automatiquement son DDL à la production.

**Critère de sortie DB :** identité de l'environnement prouvée par Ops en privé ; tables et droits nécessaires audités, migration/reprise après panne testées d'abord dans PostgreSQL jetable. Une simple réponse `table_ready=true` ne suffit pas.

## 2. CI locale et fixtures : aucune vraie transaction

La CI existante utilise PostgreSQL 16 local jetable et des clés RSA éphémères ; ne pas copier de clé ou DSN réel dans des tests. En lecture du code et pour les tests hermétiques ne nécessitant pas de base distante :

    node --test services/access-api/tests/s1s2Reconciliation.test.mjs
    node --test services/access-api/tests/mvxReceiptVerifier.test.mjs
    npm run test:release --prefix apps/frontend

Pour le scénario complet IPN, utiliser uniquement le workflow CI à conteneur localhost qui exécute `services/access-api/tests/payboxSignedIpnPostgres.test.mjs` avec `ALLOW_EPHEMERAL_MINT_PG_TEST=1`. Ne pas le reconfigurer vers Neon/Render. Vérifier en revue que la fixture refuse tout host autre que localhost/127.0.0.1 et toute base différente de `xartists_ipn_probe`.

Assertions bloquantes :
- RSA-SHA256 authentique sur données brutes ; reject signature absente/invalide, montant falsifié, identifiant marchand erroné et query/body contradictoires.
- IPN de succès **sans ID PSP `idtrans`** rejeté ; un même `idtrans` ne peut payer deux commandes.
- Deux callbacks concurrents, duplication après redémarrage, rejeu tardif : **au plus une** transition S1 et état durable.
- Après S1 fictif : `server_confirmed=true`, `payment_verified=true`, `status=paid` seulement si signature et montant corrects ; `delivery=pending`, `delivery_verified=false`, `delivered_at=null`, aucun NFT attribué.
- Timeout GitHub, HTTP 204, interruption/reprise OIDC : `204` signifie **dispatch accepté** ; aucun `mint_confirmed` ni `delivery_verified` par déduction.
- Refund/chargeback, ordre annulé, prix catalogue incorrect, mauvais buyer, faux TxHash, NFT déjà lié ailleurs : refus fail-closed.

**Succès CI = préparation uniquement**, sans attestation de PSP réel.

## 3. S1 réel Sentinel — protocole FUTUR, actuellement NON AUTORISÉ

**Ne pas exécuter les étapes de cette section pendant le sprint.** Elles constituent une checklist à lire et signer pour une campagne future *à part*, avec plafond fiat, mode PSP, bénéficiaire, politique de remboursement et autorisation humainement approuvés. Il n'existe aucun « micro-prix » implicite : le catalogue actuel définit Sentinel = **5 000 centimes EUR** ; tout prix spécial exige une nouvelle décision, un traitement PSP sûr et une vérification indépendante. Ne jamais ajuster temporairement le prix on-chain.

- [ ] Propriétaire financier signe la fiche de test, le budget maximum, le canal PSP réel et le responsable refund ; l'Architecte confirme le GO **S1 seulement**. Préproduction avec carte test officielle ≠ preuve de règlement réel.
- [ ] Ops contrôle l'identité du compte marchand et de la clé publique RSA PayBox en environnement sécurisé ; aucune clé/HMAC, URL de session, détail bancaire ou signature PSP ne va dans GitHub, logs publics ou chat.
- [ ] Après approbation uniquement, un acheteur autorisé effectue le parcours via la dApp (authentification xPortal/SIWX/JWT) ; le serveur crée la commande avec `POST /v1/checkout/paybox` en déterminant lui-même pack/prix. **Ne pas envoyer cet appel pendant le sprint**, car il pourrait créer une commande lorsque le gate commercial serait ultérieurement ouvert.
- [ ] Le PSP, non un opérateur simulant son callback, appelle `POST /v1/checkout/paybox/ipn` (ou sa variante configurée et signée) ; le serveur vérifie RSA, site/devise, montant, transaction PSP, anti-duplication et identité de commande. Ne **jamais** envoyer d'IPN artificiel à Render.
- [ ] Ops constate en privé la preuve de règlement/autorisation du vrai prestataire, `idtrans`, devise EUR, montant exact, ordre et horodatage (référence cryptographiquement liée, exposée uniquement dans coffre privé).
- [ ] Lecture du statut via `GET /v1/checkout/paybox/order/{order_id}` **avec authentification de l'acheteur**. Une réponse 401/403 sans auth est souhaitée ; ne pas contourner cette sécurité. Attendu après IPN confirmé : `status=paid`, `server_confirmed=true`, `payment_verified=true`, `delivery_verified=false` et absence de `delivered_at`.
- [ ] Si absence/réception doublon/IPN tardif ou commande non corrélable : STOP, conserver les preuves, diagnostiquer et enclencher la politique refund avant toute action S2.

Fiche publique expurgée : ID interne pseudonymisé, horodatage UTC, numéro de run, SHA déployé, statut PSP vérifié **par l'opérateur**, somme de contrôle de preuve archivée en coffre, PASS/FAIL et contre-signature. **Jamais** de buyer réel, mail, signature, ID PSP complet ou reçu bancaire dans la PR.

## 4. S2 NFT, explorateur et My Packs — FUTUR / gate distinct

- [ ] Revoir **avant tout** l'issuer, la collection, le contrat, le nonce, l'adresse buyer, le modèle de prix et l'absence de fenêtre non atomique `setPackPrice → buyPack`. L'actuel workflow `mint-on-payment.yml` refuse le live ; **ne pas lever sa barrière** en suivant ce runbook.
- [ ] Ops vérifie la solvabilité du deployer via GET mainnet, ré-estime coûts/gas et obtient un accord de financement distinct. Aucun top-up automatique ici.
- [ ] Si une implémentation de mint sécurisée est ensuite approuvée séparément : faire confirmer l'ordre S1 non remboursé, puis noter une transaction S2 **réellement exécutée** (jamais un simple HTTP 204 GitHub) et l'identifiant NFT précis.
- [ ] Liens de lecture indépendants à vérifier (ne remplacer les placeholders qu'en **registre privé**) :
  - `https://explorer.multiversx.com/transactions/<TX_HASH_64_HEX>`
  - `https://explorer.multiversx.com/accounts/<BUYER_ERD1>`
  - `https://explorer.multiversx.com/nfts/<NFT_IDENTIFIER>`
  - Gateway GET seul : `https://api.multiversx.com/transactions/<TX_HASH_64_HEX>`.
- [ ] Le vérificateur `services/access-api/src/s1s2Reconciliation.mjs` exige ordre `paid` / `server_confirmed` / `payment_verified`, montant catalogue EUR exact, `mintJob.mode=live`, pas de micro-prix, unicité PSP/TxHash/NFT, issuer/collection approuvés, et réception NFT vérifiée par `mvxReceiptVerifier.mjs`.
- [ ] Même si `attestS1S2Candidate` rend `candidate_verified=true`, sa sortie est intentionnellement `delivery_verified=false`. Il **manque** encore une écriture SQL de livraison atomique, idempotente, relue et approuvée. Aucune route publique actuelle ne permet de marquer légitimement ce statut sur simple rapport.
- [ ] Contrôler My Packs dans le navigateur authentifié : `https://neltud.github.io/xArtists/#/my-packs`. Le retour PayBox / une query `?paid=1` ne doit pas créer de propriété locale ni afficher « NFT livré ». Après S1 sans livraison SQL validée : **paid / delivery pending**. Après future livraison attestée : NFT visible pour le bon wallet avec preuve on-chain.
- [ ] Vérifier refresh, autre navigateur, reconnexion, cache, conflit de remboursements et attente de propagation. Préserver toutes les transitions d'ordre.

**Critère S2 :** transaction mainnet = succès et transfert du NFT exact au buyer, correspondance indépendante; **critère livraison :** commit SQL atomique approuvé, visible My Packs, et pas de remboursement/chargeback à la relecture. Tant que le code de livraison manque, **NO-GO**, même si une preuve S2 apparaît.

## 5. Refund ladder et rollback

| Stade | Décision sûre / responsable | Preuve et restauration |
| --- | --- | --- |
| Avant paiement | Refuser/annuler le test ; aucune nouvelle session | Vérifier aucune capture PSP ni commande « paid » |
| Session créée, pas d'IPN | Attendre statut PSP autoritatif ; ne pas interpréter retour browser | Geler dispatch, vérifier timeout et IPN tardif |
| IPN payé, pas de S2 | Suspendre mint ; **Ops** déclenche remboursement PSP selon politique approuvée | ID remboursement privé, statut final PSP, ordre non livré |
| S2 soumis, confirmation inconnue | **STOP**, réconciliation opérateur avant retry ; jamais doubler le mint | Relire chaîne et jobs, marquer `reconciliation_required` sans saut automatique |
| S2 confirmé, livraison SQL absente | Conserver l'actif et traiter litige avec revue juridique/financière | Aucune fausse attribution ; refund manuel traçable, pas de révocation NFT implicite |
| Après livraison | Chargeback/remboursement = incident séparé et revue juridique/collection | Politique d'accès et ledger compensatoire explicites ; ne pas supprimer les preuves |

**Rollback applicatif :** conserver les flags commerciaux OFF, ne pas ouvrir une nouvelle vente, arrêter le flux de test avec autorisation Ops, conserver snapshots horodatés et journaux privés, rollback logiciel uniquement via PR revue/CI et déploiement vérifié. Ne pas effacer les commandes, forcer `delivered_at`, réutiliser des PSP IDs, mint TxHash ou alterner sandbox/prod. Toute migration DB doit disposer d'une sauvegarde, d'une restauration testée et d'une fenêtre autorisée ; aucune commande SQL de rollback destructif ici.

## 6. Registre de preuve et règle de décision

Créer dans le coffre d'Ops (pas dans GitHub public) un registre horodaté contenant : SHA app/API, environnement PSP, identité de l'environnement DB vérifiée en privé, timestamps source et contrôle, signatures/approbateurs, référence PSP privée, statut order, id job, hash blockchain et NFT, ownership prouvé, refund, incidents et décision finale. Dans GitHub ne publier que références **expurgées** et verdicts sans PII.

| Porte | Résultat requis | Décision actuelle |
| --- | --- | --- |
| P0 API/config | GET /health sûre + flags inchangés | À relever au moment de revue |
| Structure Postgres | Deux tables, bonne provenance Render, droits et migration contrôlée | Non prouvé intégralement |
| CI IPN | RSA, replay, concurrence, refund, restart, prix exact | Simulé en CI, pas PSP réel |
| S1 paiement | Reçu marchand indépendant + IPN RSA + ordre `server_confirmed` | **NON EXÉCUTÉ** |
| S2 reçu NFT | Vrai hash, NFT id, issuer, buyer, transfer, unicité | **NON EXÉCUTÉ** |
| Livraison et My Packs | Commit SQL atomique + propriété confirmée + anti-refund | **NON IMPLÉMENTÉ / NON EXÉCUTÉ** |
| Refund | Essai documenté et rapprochement PSP indépendant | **NON EXÉCUTÉ** |

**Verdict : NO-GO S1 réel / S2 / livraison / commercial.** Une revue humaine doit lever chaque porte séparément, jamais automatiquement à la faveur d'une CI verte.

### Sources vérifiées dans le repo

- `services/access-api/src/server.mjs` : routes `/health`, `/v1/ops/orders-store/status`, `/v1/ops/mint-jobs-store/status`, `/v1/checkout/paybox`, `/v1/checkout/paybox/ipn`, `/v1/checkout/paybox/order/{id}`.
- `services/access-api/src/orders.mjs`, `mintDispatch.mjs`, `s1s2Reconciliation.mjs`, `mvxReceiptVerifier.mjs`, `services/access-api/sql/mint_jobs.sql`.
- `docs/OPS_PAYBOX_SIGNED_IPN_RECONCILIATION_2026-11-03.md`, `docs/OPS_S1_S2_RECONCILIATION_2026-11-03.md`, `docs/GO_LIVE_S1_S2.md` et `docs/ops/PAGES_OFFRES_AND_MINT_JOBS_PROBE_2026-11-03.md`.

Toute observation « live » doit être refaite à la date d'approbation : ce fichier est un plan d'exécution **et non une attestation d'exécution**.
