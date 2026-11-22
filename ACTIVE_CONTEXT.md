# ACTIVE_CONTEXT — xArtists / xOrus

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
