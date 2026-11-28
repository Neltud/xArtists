# ACTIVE_CONTEXT — xArtists / xOrus

## Arrêt définitif du fournisseur Vellum.ai — 28 novembre 2026

Décision propriétaire : abandon du fournisseur, sans remplaçant fictif. Le moteur d'intentions et le proxy dédiés sont retirés; le journal 8008 ne transmet plus rien, les tâches RAG restent locales et les lectures de secours obsolètes sont supprimées. Les contrats, données historiques, services xOrus et Studio sont indépendants. Les anciens documents ci-dessous ne sont pas des consignes opérationnelles. Ne pas réintroduire ce fournisseur. Révocation des clés externes et vérification des éventuels services hébergés restent des opérations d'administration distinctes.

## Retrait de la console publique Vellum — 28 novembre 2026

- Retrait de la console statique `/vellum/` : page d’état uniquement, aucun formulaire, journal local, calcul de plafond ou moteur public. Suppression du fichier public `engine.mjs`. Les packages et pipelines internes restent intacts.
- Réintroduction uniquement après validation d’un parser FR/EN (espaces, NBSP, virgules), seuils par devise sans conversion USD inventée et couverture navigateur verte. Signature et exécution restent interdites.
- Le retrait ne constitue ni une activation de commerce ni une preuve de correction du parser interne. La preuve de publication Pages sera vérifiée séparément.
- Reproduction du retrait décrit par l’opérateur : le commit local `94a67e87` n’est pas accessible sur GitHub au moment de ce correctif. Les notes historiques ci-dessous ne décrivent pas l’état courant de la console.

## Vellum command — 28 novembre 2026 (~05:40 UTC)

- Sonde lecture seule. Pages **0.139.0** sert `2d4138cb` (140 routes, `lia_live_trading=false`, construit `2026-11-27T20:08:27Z`). Hub xOrus HTTP 200, source `293417d9`, stance **ABSTAIN**, exécution / signature / custody / paiement **fermés**, 0 wallet. `api.xartists.art` **NXDOMAIN**.
- Tranche de code, **pas un GO** : `packages/vellum-command` traduit une intention en plan papier. Plafond pilote 5 USD. Vidage, signature immédiate et dépassement sont des vetos. `executionAuthorized=false`. Page statique `/vellum/` après le prochain déploiement Pages. Aucun quote, aucun rendement affiché.
- Veille : MultiversX opérationnel au 27 nov. xPortal route ses swaps via Pegaroute (26 nov) — adaptateur externe, pas le nôtre. WalletConnect provider dApp toujours en série 5 ; le correctif amont 6.2.0 n’est pas mergé.
- Bloquants humains inchangés : [#506](https://github.com/Neltud/xArtists/issues/506), [#428](https://github.com/Neltud/xArtists/issues/428), [#341](https://github.com/Neltud/xArtists/issues/341).
- Interdit : `LIA_LIVE_TRADING`, `paybox_checkout_enabled`, mint public, assisted POST, annonce de commerce ouvert.

Preuve : [`docs/ops/VELLUM_COMMAND_2026-11-28.md`](docs/ops/VELLUM_COMMAND_2026-11-28.md).


## Sonde et suite — 25 novembre 2026 (~05:40 UTC)

- Lecture publique seulement. Pages **0.139.0** sert `c051d986` (workspaces MultiversX/Solana, build `2026-11-24T16:26:50Z`, `lia_live_trading=false`, 140 routes). Le tip `main` a ensuite reçu des commits data ; ils ne sont pas le SHA Pages.
- API Render `8b6fae84` : HTTP 200. Checkout, mint live, enchères, upload et pont $TRO **off**. PayBox configuré en prod, checkout **désactivé**. Studio store **503**, `table_ready=false`. `api.xartists.art` **NXDOMAIN**.
- Hub Neon inchangé : `e580388b`, exécution fermée, budget live implicite 0, 0 wallet, stance **ABSTAIN**. `GET /v1/xorus/reference-quotes` répond **404**. Le schéma est dans le code, pas dans le bundle servi. Aucun reçu de remplacement n’est écrit par ce correctif.
- Correctif public, **pas un GO** : le bureau xOrus affiche l’univers d’admission en local (`quotes=[]`, aucun appel réseau). Une ligne d’univers n’est pas un swap. Le pairing xPortal ferme le relais abandonné avant le relais suivant ; cela ne prouve pas l’allowlist [#506](https://github.com/Neltud/xArtists/issues/506).
- Bloquants humains inchangés : [#506](https://github.com/Neltud/xArtists/issues/506), puis [#428](https://github.com/Neltud/xArtists/issues/428), [#341](https://github.com/Neltud/xArtists/issues/341), migrations Studio après backup.
- Interdit : `LIA_LIVE_TRADING`, `paybox_checkout_enabled`, mint public, assisted POST, annonce de commerce ouvert. Le provider WalletConnect reste en 5.0.2 ; le correctif upstream 6.2.0 n’est pas mergé ici.

Preuve : [`docs/ops/PROBE_PUBLIC_2026-11-25.md`](docs/ops/PROBE_PUBLIC_2026-11-25.md).

## Sonde et suite quotes — 24 novembre 2026 (05:33 UTC)

- Lecture publique seulement. Pages **0.139.0** sert `5271cefe` (cockpit V2, build `2026-11-23T17:19:23Z`, `lia_live_trading=false`). API Render reste `8b6fae84` : checkout, mint live, enchères, upload et pont $TRO **off**. PayBox est configuré en prod et le checkout est **désactivé**. Studio store **503**, schéma absent. `api.xartists.art` non résolu.
- Hub Neon inchangé à l'exécution : source `e580388b53d65da6f10f86bab37527215f5072f3`, `execution_authorized=false`, `live_budget_cents=0`, stance **ABSTAIN**, 0 wallet, valorisation paper **manuelle**. Les commandes paper sans token répondent 401. Aucun registre de risque live.
- Prochaine tranche de code, **pas un GO** : schéma `GET /v1/xorus/reference-quotes` (univers + règles d'admission, `quotes=[]`, aucun I/O, POST 405). Il ne remplace pas le bundle Neon tant qu'un reçu de déploiement n'est pas écrit. Une quote n'est pas un fill ; le catalogue n'est pas une preuve de swap.
- Bloquants humains inchangés : [#506](https://github.com/Neltud/xArtists/issues/506) allowlist xPortal, puis [#428](https://github.com/Neltud/xArtists/issues/428) deux hashes Explorer, [#341](https://github.com/Neltud/xArtists/issues/341) réception mail, migrations Studio après backup. PR UX [#634](https://github.com/Neltud/xArtists/pull/634) reste un brouillon, hors de ce correctif.
- Interdit par cette mise à jour : `LIA_LIVE_TRADING`, `paybox_checkout_enabled`, mint public, assisted POST, annonce de commerce ouvert.

Preuve : [`docs/ops/PROBE_PUBLIC_2026-11-24.md`](docs/ops/PROBE_PUBLIC_2026-11-24.md).

## Terminal paper publié — 22 novembre 2026 (18:35 UTC)

- [PR #630](https://github.com/Neltud/xArtists/pull/630) fusionnée après **16 contrôles CI verts**, dont le nouveau parcours mobile complet. **41 tests service**, **525 tests frontend**, TypeScript, build et audit des 140 routes réussis.
- [Bêta xOrus](https://xartists.art/intelligence/xorus/?lang=fr) publiée par Pages au commit `57ab0ebc1786603b12e0e9e74d59e6592c05e688` ; terminal **en simulation locale**, 100 USD virtuels, entrée / valeur manuelle / clôture / journal conservé sur l'appareil. Ouverture de 5 USD puis clôture à valeur identique et rechargement vérifiés sur le site public ; résultat **fictif** -0,02 USD de frais, aucun argent engagé.
- Fonction Neon `xorushub` déploiement **4**, runtime source `e580388b53d65da6f10f86bab37527215f5072f3`. Nouveau journal PostgreSQL **opérateur virtuel**, séparé des journaux anonymes locaux : transaction, verrou de ligne, garde de révision, idempotence, limites de positions, pertes/frais et haltes. Aucun registre de risque live implémenté.
- Nouvelle table sandbox `xorus_paper_pilots` uniquement. Vérification SQL nominative : deux écritures concurrentes → une acceptée, une refusée ; clôture persistée à révision 2 ; états avec exécution active ou flag absent refusés. Cette ligne `verification-paper-e580388b53d6` est une preuve de simulation et ne finance pas le pilote opérateur. Aucun compte, wallet, Studio ou commerce existant modifié.
- Manifeste public `/v1/xorus/paper` : 200. Compte et commandes sans token : 401. Token serveur existant conservé ; auth HTTP positive non répétée sur ce déploiement. Interfaces testées positivement en tests isolés, SQL et contraintes vérifiés via Neon. Ordres réels toujours 503, budget live zéro, aucune signature ni inférence IA.
- Planificateur existant conservé à quinze minutes. La prochaine tranche d'exécution requiert les vrais quotes/valuations, un registre live et un adaptateur de signature autorisé ; la simulation n'est pas une preuve de trading réel ni de profit.

Preuve complète : [`deploy/neon/xorus-hub/paper-terminal-receipt-20261122.json`](deploy/neon/xorus-hub/paper-terminal-receipt-20261122.json). Désactivation : restaurer le bundle `af8e5674db20e06fce476b1b08b7dc1eae3a8e04` sans remplacer les variables ; garder le journal pour l'audit.

## Politique de risque préparée — 22 novembre 2026

- [PR #628](https://github.com/Neltud/xArtists/pull/628) fusionnée après six contrôles verts ; **31 tests** réussis. Fonction `xorushub` mise à jour, déploiement **3**, source runtime `af8e5674db20e06fce476b1b08b7dc1eae3a8e04`, Neon Free inchangé.
- [Politique HTTPS](https://br-steep-sun-bab7l93p-xorushub.compute.c-8.eu-central-1.aws.neon.tech/v1/xorus/risk-policy) : **200**. Profil de référence plafonné à **100 USD** : **40 MultiversX / 40 Solana / 20 en réserve**, autres réseaux PayBox à zéro au démarrage. Réduction proportionnelle si le capital dédié est plus faible ; cette référence n'est pas un solde ou une instruction de dépôt.
- Ordre plafond **5 USD**, une position par réseau, spot sans levier, slippage 50 bps. Arrêts pertes/frais sur 24 h glissantes : **1 USD par réseau / 2 USD ensemble** ; cumul pilote **2,50 USD par réseau / 5 USD ensemble**, sans recharge automatique par les profits. Un seuil d'arrêt n'est pas une garantie de perte maximale absolue.
- Univers demandé : tokens réellement compatibles PayBox + MultiversX ; identité exacte chaîne/contrat/mint, liquidité/route de sortie, quote fraîche et simulation restent requises. La présence dans le catalogue PayBox n'est pas une preuve qu'un swap est supporté. MultiversX conserve son signer utilisateur distinct.
- **Allocation réelle = 0 ; budget live = 0.** Capital dédié, soldes et grants non vérifiés ; aucun registre atomique de risque live implémenté. Aucune permission PayBox modifiée ni transaction demandée. Routes financières toujours 503, rapports opérateur toujours 401 sans token ; cadence native de quinze minutes conservée.

Reçu : [`deploy/neon/xorus-hub/risk-policy-receipt-20261122.json`](deploy/neon/xorus-hub/risk-policy-receipt-20261122.json). La politique définit les plafonds à brancher aux futurs adaptateurs ; elle n'active aucun flag finance et ne remplace pas les limites plus strictes d'un ancien adaptateur.

## Agents et exposition publiés — 22 novembre 2026 (11:04 UTC)

- **Deux agents d'observation mainnet réellement exécutés**, sur la fonction Neon Free `xorushub`, déploiement 2, source runtime `5f4dda14a9e18b517d89991224752fd71fc5538a`. [PR #627](https://github.com/Neltud/xArtists/pull/627) fusionnée, six contrôles CI verts, 25 tests du service réussis.
- Reçu du premier cycle natif persisté à **11:04:03 UTC** : MultiversX metachain `41725895`, identité `1`, âge du bloc 1,08 s, collecte 262 ms ; Solana slot **finalisé** `472517319`, identité genesis mainnet vérifiée, âge du bloc 0,61 s, collecte 2 794 ms. Les deux statuts sont `observed`. Ces mesures datées ne préjugent pas des prochains cycles.
- Trigger existant réutilisé et renommé `xorus-hub-cycle`, actif, cron final **`*/15 * * * *` UTC**. Vérification initiale à la minute puis cadence finale restaurée. Le minimum de 14 minutes peut ignorer le premier créneau de 11:15 après la vérification de 11:04 ; ensuite cadence au quart d'heure. Aucun second ordonnanceur ni abonnement payant créé.
- Manifeste public `/v1/xorus/agents` : 200, sans accès DB. Rapports `/v1/xorus/agents/reports` : authentification opérateur, 401 sans token ; preuve persistée relue via SQL sur la seule base sandbox autorisée. Réponses périmées explicites ; aucun ancien résultat réutilisé lors d'une panne.
- **Observation déterministe, pas d'inférence IA**. Zéro wallet lié par ce service ; aucune signature, ordre, swap, pari ou transfert. Les routes d'exécution répondent toujours 503. Aucun flag finance levé et aucune modification du connecteur xPortal existant.
- [PR #626](https://github.com/Neltud/xArtists/pull/626) fusionnée après 17 contrôles verts ; Pages `58d30cce` vérifié en HTTPS. [Éditeur](https://xartists.art/create/gallery), [exemple HTML autonome](https://xartists.art/examples/exposition-autonome.html) (200, image embarquée) et [service sur devis](https://xartists.art/offres) publiés. Aucun tarif, encaissement ou revenu réalisé annoncé.

Preuve complète et limites : [`deploy/neon/xorus-hub/deployment-receipt-20261122.json`](deploy/neon/xorus-hub/deployment-receipt-20261122.json). Désactivation / retour arrière : [`deploy/neon/xorus-hub/README.md`](deploy/neon/xorus-hub/README.md#désactivation-et-retour-arrière).

## Mesure publique — 22 novembre 2026 (05:33 UTC)

Sonde lecture seule. **Aucun** drapeau commerce, mint ou trading n'a été levé. Détail : [`docs/ops/PROBE_PUBLIC_2026-11-22.md`](docs/ops/PROBE_PUBLIC_2026-11-22.md).

| Surface | Observé |
| --- | --- |
| Pages | **0.139.0** · SHA **`d5f1140e`** servi avant ce correctif de titre · construit `2026-11-21T16:39:57Z` · 140 routes · `lia_live_trading=false` |
| API Render | HTTP 200 · SHA `8b6fae84` · checkout / mint live / upload / enchères **off** · PayBox prod **sans** checkout |
| `api.xartists.art` | **NXDOMAIN** |
| Studio | HTTP **503** · schéma absent |
| xOrus | `paper_only` · **ABSTAIN** `thin_tape` · 6/120 · `2026-11-22T05:33:03Z` |
| Hub Neon | sandbox lecture seule · 0 wallet · pas l'API de prod |
| Code | Titre public xOrus novice sur `main` (`8140bae9`) et sur [PR #626](https://github.com/Neltud/xArtists/pull/626). Exposition HTML après `ux-local` vert. Aucun gate finance. |

Le site public était `d5f1140e` au moment de la sonde. Le commerce ne l'est pas. Le titre xOrus part avec le prochain build Pages.

## Passerelle plateformes — 21 novembre 2026 (16:34 UTC)

`xorushub` est déployé sur **Neon Free**, dans `xartists-access-sandbox` uniquement. Une seule organisation logique `xartists` ; aucun compte fournisseur ni wallet fusionné. Source runtime `825292a7ef2e397d98d9cfdf34065dc99f11ac72` ; [PR #625](https://github.com/Neltud/xArtists/pull/625).

- [Health HTTPS](https://br-steep-sun-bab7l93p-xorushub.compute.c-8.eu-central-1.aws.neon.tech/health) et registre `/v1/xorus/platforms` répondent 200. Cette fonction n'est pas `access-api`.
- Livraison native Neon prouvée à **16:34:00 UTC** ; reçu persistant à 16:34:01 UTC. Quatre endpoints **techniques** atteints : Bitcoin, Solana, Polymarket, Kraken. Aucun prix ou signal de marché collecté.
- Trigger `xorus-hub-hourly` actif, cron final `17 * * * *` UTC.
- **Zéro wallet lié**, signatures externes non implémentées, exécution fermée, stance ABSTAIN.

Preuve : [`deploy/neon/xorus-hub/deployment-receipt-20261121.json`](deploy/neon/xorus-hub/deployment-receipt-20261121.json).

## Mesure publique — 20 novembre 2026 (~18:54 UTC)

Historique. Pages `9610b56`, API `8b6fae84`, studio 503, commerce fermé. Détail : [`docs/ops/PROBE_PUBLIC_2026-11-20.md`](docs/ops/PROBE_PUBLIC_2026-11-20.md).

## Garde-fous

Aucun paiement, mint, trading live, transfert ou migration prod n'est activé par le correctif de titre. `LIA_LIVE_TRADING` reste interdit. PayBox configuré n'est pas un encaissement.
