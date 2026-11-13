# PASSATION GROK — revue contradictoire xArtists / xOrus
**13 novembre 2026 · référence repo observée : `6c7c1ff1e52866b14cb645159c782b1c3b47bfd4` · document de travail, pas un certificat live**

## Position et mission

Grok est un **auditeur externe non privilégié** des seuls éléments publics de xArtists. ChatGPT conserve la vérification croisée des conclusions et peut implémenter séparément des correctifs testés ; aucun des deux agents n'a autorité pour certifier seul une vente ou une transaction. Il peut proposer des correctifs et produire des tests sur branche séparée si une connexion GitHub l'y autorise. Il ne détient pas de wallet, ne signe rien, ne lance pas de trading, ne déclenche aucun achat, aucune transaction, aucun mint, aucune migration de base réelle, aucun déploiement ni aucune bascule des domaines. Son avis contribue **au plus à 15 %** du recoupement et un veto Sentinel risque est bloquant.

**Vente** : xArtists ne revend **pas** les données brutes collectées. Le produit est une **analyse dérivée** de marchés, DeFi, risque et art, avec droits commerciaux des sources vérifiés, provenance, incertitude et livraison privée. Les flux fournisseurs sous licence insuffisante ne sont pas exportés ni placés dans un bundle client.

Ne pas reprendre les instructions historiques de trading LIA/Vellum, les anciens prix contradictoires ou les anciens statuts de CI. Vérifier le `main`, les endpoints, les PR et les SHA **au début de chaque revue**. Une page présente ≠ service opérationnel ≠ produit livrable ≠ GO marchand.

## Éléments déjà prouvés dans GitHub (à vérifier de nouveau)

- Dépôt canonique : https://github.com/Neltud/xArtists ; site : https://xartists.art ; API : https://xartists-access-api.onrender.com.
- `#561` : API de lecture privée xOrus avec JWT Neon vérifié, rapports digest SHA-256, droits, quotas PostgreSQL et refus par défaut. **Aucun accès premium activé en prod**.
- `#562` : catalogue commercial public serveur `/v1/commercial/catalog`, services EUR cibles **3,79 / 5,79 / 9,79 € par mois** indépendants des trois packs NFT Genesis **33 / 22 / 11 EGLD**. Aucun droit abonnement/trace xOrus attribué par un niveau de prix non approuvé. `sale_open=false`.
- `#563` : `/workspace/account`, email OTP Neon préparé, `GET /v1/account/me` en lecture seule et preuve SQL `to_regclass` des 4 tables avant l'activation. **Compte email prod encore fermé**. PR validée 30/30, SHA merge `fa110bf4cfaab6e36a408000670c4187f2be2104`.
- `#564` : plan d'exploitation mail OVH pour `admin@xartists.art` et `contact@xartists.art`, audit VPS en lecture seule, **aucune redirection créée/prouvée**. SHA merge `b8e8afde251094be0c4b58910acfc1409243c131`.
- `#547` et `docs/XORUS_FUNCTIONAL_PRODUCT_MATRIX_2026-11-13.md` : priorité à la décision explicable en page xOrus/Agents/Lab. Catalogue 12 familles × 10 axes = **120 définitions** et non 120 sources actives. Une observation paper xOrus du 13/11 matin faisait état de 48 bougies, 6 métriques dérivées, 3 familles, **0 attestation indépendante**, verdict `ABSTAIN` ; **ne pas réutiliser ces nombres comme état live actuel sans relecture**.
- Essai de préproduction Neon **isolé uniquement** `br-purple-art-basunba9` : 9 tables métier compte/xOrus, 7 clés étrangères, tests synthétiques de quota/révocation/remboursement ; migrations Studio `004/005/006` et GLB vérifiées. La base principale, le DSN Render et l'activation publique n'ont **pas été certifiés par cet essai**.
- Audit du compte Stripe Nelsonprods **livemode** du 13/11 : 3 produits xArtists actifs (Pulse, Yield, Sentinel), **0 prix récurrent actif et 0 webhook endpoint** à cette lecture. Vérifier à nouveau avant d'en conclure un état actuel. Pas de Checkout live vérifié.
- API Render : une table de **commandes PostgreSQL réellement prête** a été prouvée par `/v1/ops/orders-store/status` ; cela **ne prouve pas** l'identité de `DATABASE_URL` ou la présence des tables comptes/Studio. Lors du dernier relevé, Studio store HTTP 503, upload IPFS OFF, frais et mint OFF.
- xPortal / Reown : la connexion QR publique et l'allowlist des origines `xartists.art` et `www.xartists.art` restent à valider sur les vrais appareils ; `#506`.
- Marketplace : un achat **historique** de listing NFT est documenté et l'utilisateur a confirmé sa réception ; **nouveau parcours vendeur → listing → escrow → achat → réception** non certifié, `#428`. Ne pas déduire une ouverture globale de ce pilote.
- Domaine / email : MX `1 mail.xartists.art` et VPS OVH ; la console d'administration mail et quatre réceptions tests restent absentes, `#341`. **Ne jamais publier l'adresse de redirection Gmail personnelle dans GitHub.**
- Licence Artprice B2B non attestée, `#487` ; xRights premium `#416` et distribution NFT `#403` non certifiés.

**Références sans ambiguïté** : `ACTIVE_CONTEXT.md` est daté d'une vérification matinale antérieure aux PR #561–#564 ; le README contient également des chiffres du 12 novembre. Ne pas traiter ces anciennes phrases comme vérités runtime. Relire les endpoints en HTTP et leur build SHA avant toute conclusion.

## Roadmap d'exécution, découpage en lots vérifiables

| Ordre | Lot | Livrable concret | Gate / NON-autorisé |
|---|---|---|---|
| P0 / 1 | **Vérité release** | Comparer main SHA, `build-info.json` Pages et `/v1/ops/build-info` API ; lire `/health`, `/v1/commercial/catalog`, xOrus analysis, Studio/orders ; signaler les incohérences exactes | Ne pas annoncer « live » si une requête échoue, si SHA divergent ou si source est seulement mock |
| P0 / 2 | **xOrus coeur produit** | Audit code `lia/xorus`, route analysis, `XorusDecisionDesk`, Agents/Lab ; un vrai rapport explicable horodaté, qualité des sources, 0 fausse donnée premium, `ABSTAIN` par défaut | Sentinel veto, Chair externe ≤15 %, aucune signature/trade ou promesse de rendement |
| P0 / 3 | **Base + compte email** | Identifier **sans exposer le DSN** la DB liée à Render et sa sauvegarde/restauration, tests OTP réels navigateur, session JWT vérifiée, `/me` sans accès intercompte | Aucune migration sur branche principale ni activation de l'inscription par déduction |
| P0 / 4 | **Abonnements et livraison** | Contractualiser les avantages Pulse/Yield/Sentinel face aux 3 prix cibles ; prix Stripe `recurring`/TTC, webhook signé idempotent, annulation/refund, quota + rapport privé dérivé | Pas de Checkout live tant que flux sandbox complet, droits sources et CGV ne sont pas certifiés |
| P0 / 5 | **xPortal et NFT du propriétaire** | Reown origins/QR Android/iOS, propriété NFT sur chaîne, listing signé, frais/royalties, escrow, achat + reçu et NFT chez acheteur | Ne pas signer ni publier une TX à la place du propriétaire ; tests sur preuve réelle |
| P1 / 6 | **Studio sculpture / IPFS** | Contrôle DB prod, Pinata, limite GLB 32 MiB, SHA-256 octets, CID readback, média et metadata, minter NFT role, reçus de livraison | Migrations isolées ≠ migration prod, IPFS pin ≠ NFT final |
| P1 / 7 | **Canaux business et droits** | Admin/contact OVH + réception Gmail confirmée, xRights/extension, licence Artprice, conformité données/API, dépendances | Éviter fuite de destination privée, fichiers artistes ou API feeds ; pas d'email public non livré |
| P2 / 8 | **Évolution multichaîne/DAO** | OpenSea découverte/lecture, offres multi-chaînes séparées, distributeur/DAO à preuves propres | Aucun swap, bridge, custody, enchère, RWA ni trading automatique dérivé d'un affichage UX |

**Livrables premiers** : 1) revue contradictoire des trois plus importants P0 avec traces source + verdict ; 2) une PR **minimale code + tests, sans changement de prod**, dans le propriétaire de fichiers attribué ; 3) un manifeste de preuves et blocages exacts. Éviter une refonte esthétique des 133 routes avant de rendre réels décision, droits et délivrabilité.

## Prompt prêt à coller dans Grok

> Tu es GROK, relecteur externe NON PRIVILÉGIÉ de xArtists / xOrus. Ta mission est un audit contradictoire du code et de la trajectoire de commercialisation : repérer des défauts reproductibles, des faux états « live », des droits d'accès non liés aux preuves PSP/NFT, des problèmes de sécurité, de conformité de données et des UX confuses. Ne valide rien par complaisance. **L’objectif est de vendre les analyses dérivées xArtists, jamais les données brutes partenaires.**
>
> Références : repo https://github.com/Neltud/xArtists, base main observée `6c7c1ff1e52866b14cb645159c782b1c3b47bfd4` (à rafraîchir), site https://xartists.art, API https://xartists-access-api.onrender.com. Lis `ACTIVE_CONTEXT.md`, `docs/XORUS_FUNCTIONAL_PRODUCT_MATRIX_2026-11-13.md`, `docs/security/launch-gates.md`, `docs/ops/WALLETLESS_OTP_SELF_ACCOUNT_2026-11-13.md`, `docs/ops/XARTISTS_OVH_MAIL_FORWARDING_2026-11-13.md`, les PR #561–#564 et issues #548, #465, #506, #428, #281, #341, #487.
>
> **Étape A — AUDIT, lecture seule** : (1) recontrôle main SHA complet, Pages build SHA, API build SHA, /health, /v1/xorus/analysis, /v1/commercial/catalog, /v1/ops/orders-store/status et /v1/ops/studio-store/status avec HTTP status/heure ; (2) vérifie les 120 IDs signal contre les signaux réellement indépendamment certifiés, fraîcheur, veto Sentinel et abstention ; (3) examine les frontières JWT/OTP/SIWX, revocation, quotas SQL, facturation et rapport privé ; (4) revois listing NFT propriétaire, xPortal QR et Studio IPFS ; (5) compare ce qui est promis sur les pages xOrus, Agents, Lab, Offres aux fonctions réellement prouvées.
>
> **Étape B — PLAN** : classe les problèmes P0/P1/P2. Pour chaque point : chemin + lignes/commit, risque, reproductions, test manquant, dépendance humaine/externe, correction minimale, estimations non inventées et statut `CONFIRMÉ / PARTIEL / NON VÉRIFIÉ`. Indique exactement les conditions GO/NO-GO par flux et les 3 prochains PR les plus utiles, ordonnées par impact client et risque.
>
> **Étape C — CONTRIBUER** : sur accès GitHub explicitement autorisé seulement, prends **un seul P0** en branche indépendante `grok/p0-<sujet>-<date>` ; tests déterministes avec cas négatifs, pas de tests supprimés, pas de `continue-on-error`, aucune donnée simulée présentée live ; PR draft, pas de merge ni déploiement. Si tu n'as pas les permissions, donne un diff proposé et des tests reproductibles au lieu d'affirmer l'avoir appliqué. Évite les chemins modifiés par un autre agent.
>
> **Interdictions** : ne demande ni PEM, seed, mot de passe, API key, cookie OVH, JWT ou destination Gmail privée. Ne publie aucune donnée artiste/abonné ni feed tiers non licencié. Pas de trade, signature, mint, déploiement, changement de DNS, paiement, abonnement live, migration en base de production, secret ou webhook réel. Ne crée pas de faux signaux. **Sentinel a veto**, ton avis est plafonné à **15 %**, exécution toujours paper. Ne transforme jamais la CI verte en attestation de livraison client.
>
> **Réponse attendue en français** :
> 1. `BASE ET PREUVES` : SHA précis, date, endpoints, exactitude et inconnus.
> 2. `TOP 10 ANOMALIES` : gravité + lien fichier/ligne + scénario + test échouant réellement reproduit (ou « non exécuté »).
> 3. `ROADMAP 3 SPRINTS` : P0 opérationnel, P1 qualité produit, P2 expansion, avec critères de sortie.
> 4. `PR #1 PROPOSÉE` : périmètre de 3–8 fichiers maximum, tests, commandes, impact et rollback.
> 5. `DECISION` : GO pour lecture seule / NO-GO pour paiement, mint et trading tant que les preuves manquent.
> 6. `MESSAGE POUR CHATGPT` : bloc de passation contenant SHA + résultats vérifiés + changements proposés + blocages.
>
> Commence immédiatement l'audit. Lorsque l'accès à un service échoue, écris `NON VÉRIFIÉ` ; ne remplis jamais le blanc par une supposition.

## Limites d'intégration et piste réelle vers l'API Grok

L'outil `scripts/ops/grok-readonly-review.mjs` et le workflow `.github/workflows/grok-manual-readonly-review.yml` existent. Ils appellent `grok-4.7` sur l'API xAI **uniquement** par `workflow_dispatch` et envoient des diffs publics autorisés des PR **#407** ou **#430**. La clé **`XAI_API_KEY`** doit être renseignée par un opérateur dans les **Secrets GitHub Actions**, jamais dans le dépôt. Il ne s'agit **pas** encore d'un auditeur automatique du repo entier. À cette session, aucune réponse Grok API n'a été observée ; ne pas dire « Grok a audité ».

Pour donner à Grok l'intégralité de la mission ci-dessus, utiliser son interface authentifiée avec ce prompt, ou développer une **nouvelle** cible explicite dans le workflow existant après revue de l'allowlist (éviter d'envoyer l'ensemble du repo, media ou données privées à un service externe). Un appel API xAI peut être facturé ; jamais de boucle de requêtes automatique à frais non bornés.
