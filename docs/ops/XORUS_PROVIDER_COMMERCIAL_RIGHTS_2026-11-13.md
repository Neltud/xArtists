# xOrus — licences des sources et verrou commercial

Revue du 13 novembre 2026. Statut : **TOUTES LES SOURCES COMMERCIALES SONT BLOQUÉES**. Cette matrice est une note opératoire, pas une interprétation juridique définitive, ni un contrat, ni une approbation pour vendre.

## Deux droits distincts

1. Analyse commerciale dérivée : des synthèses, commentaires, évaluations de risque et rapports originaux xArtists, sans extraction réutilisable du feed source. Nécessite le périmètre de licence commerciale applicable et, si prévu, attribution.
2. Redistribution de données brutes : exports, séries OHLCV, données tierces, API et syndication. Ce n'est PAS le produit xArtists ; les plans payants d'analyse peuvent ne PAS donner ce droit.

L'ancien data_feed.build_data_pack exige redistribution_allowed pour son mode historique internal_research ; cela **ne démontre pas** un droit contractuel réel. Le nouveau mode intended_use="commercial_analysis" exige commercial_derivatives_allowed et un fournisseur avec entrée de code commercial_ok + approved_license_ref vérifiée. Le droit d'analyse dérivée ne doit pas être assimilé au droit de redistribution.

**Tous les commercial_ok valent False et toutes les références de contrat approuvé valent None au 13 novembre 2026.** Un booléen auto-déclaré dans trusted_providers, une preuve SHA-256 ou un prompt client ne débloque rien. Les compteurs independently_verified_signals restent à 0 ; le rapport reste paper_only / ABSTAIN / commercial_enabled=False.

Le data pack contient des observations internes et ne doit JAMAIS être renvoyé à un navigateur client, vendu comme feed ou incorporé dans un NFT. Seules des projections de rapports originales séparées et protégées par des droits vérifiés peuvent être livrées plus tard.

## Registre de licences et état

| Identifiant code | Usage potentiel | Droit commercial xArtists établi | Condition encore manquante |
| --- | --- | --- | --- |
| binance_spot_public | Klines Spot EGLDUSDT du moteur paper | NON | Clarification du périmètre de licence REST Spot et contrat écrit applicable au produit dérivé |
| binance_vision_dataset | Jeux de données historiques Binance Vision | NON | Terms non commerciaux, besoin d'accord enterprise écrit |
| coingecko_api | Prix/volume/macro alternatifs | NON aujourd'hui | Plan paid réellement souscrit + conditions de champ et attribution + preuve de droits des analyses |
| artprice_b2b | Marché de l'art et signaux Artprice | NON | Licence B2B écrite et périmètre des dérivés, images, indices et stockage |
| multiversx_public_api | Lecture d'états et transactions via indexeur | NON certifié | Revue conditions spécifiques d'usage API et rate-limit ; distinguer état on-chain de données enrichies tierces |
| multiversx_native_chain | Événements et preuves de blocs natifs | Pas de feed privé présumé | Contrôle des nœuds et finalité, provenance et cohérence entre sources indépendantes |
| opensea_api | Indexeur NFT | NON | Droits du plan et ToS précis |
| social_platform | Sources sociales / news (selon plateforme) | NON | Accord source par source, conservation et attribution |

Le réseau on-chain est public mais le droit d'accéder à une API commerciale, la fiabilité et l'indépendance d'une mesure ne découlent pas de la publicité du ledger. Source proof-of-bytes, corroboration indépendante et droits commerciaux sont trois preuves différentes.

## Sources officielles

- Binance Vision Dataset Terms v1.0 (26 août 2026) : https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md . Les conditions datasets excluent les produits monétisés sans accord enterprise ; vérifier spécifiquement l'applicabilité aux requêtes REST Spot.
- Binance REST Spot, endpoint public market data : https://developers.binance.com/en/docs/products/spot/rest-api .
- CoinGecko Commercial vs Custom : https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses . Des plans payants autorisent certains rapports originaux avec attribution mais pas la revente d'accès au feed, les exports libres ni nécessairement l'entraînement IA.
- Artprice : https://fr.artprice.com/block/cgv?modal=true . Les conditions changent selon le produit ; le lien ne certifie PAS une licence Artprice B2B marchés ou images.
- API publique MultiversX : https://docs.multiversx.com/sdk-and-tools/rest-api/multiversx-api/ . Limitation publique publiée de deux requêtes / IP / seconde et différences entre données blockchain natives et indexeur.

## Courriers prêts à envoyer (NON ENVOYÉS)

Les deux adresses professionnelles OVH de xArtists ne sont toujours pas certifiées en réception. Vérifier les contacts commerciaux officiels des trois fournisseurs avant l'envoi. Ne jamais ajouter ici des identifiants, une destination Gmail personnelle ou un document contractuel privé.

### Binance — demande licence et périmètre

**Objet : xArtists / xOrus — Clarification REST Spot et demande de licence d'analyses commerciales dérivées**

Bonjour,

Nous développons xArtists / xOrus, un service de synthèses de marché, de rapports dérivés et d'explications des risques pouvant être proposés par abonnement, sans diffusion de séries OHLCV, d'accès API, de données brutes ou de signaux de trading exécutables.

Nous souhaitons clarifier formellement l'applicabilité des Binance Vision Dataset Terms (26 août 2026) aux lectures publiques REST Spot data-api.binance.vision/api/v3/klines, ainsi que les droits nécessaires pour utiliser des indicateurs dérivés des cours EGLDUSDT dans nos rapports payants dans l'UE. Merci de préciser le contrat enterprise adapté, les obligations de citation, stockage, durée, volumétrie, IA et les restrictions de distribution.

Pouvez-vous nous orienter vers l'équipe habilitée et les documents nécessaires à la contractualisation ? Nous ne considérerons pas cette source comme commercialement autorisée sans confirmation écrite.

Cordialement,
L'équipe xArtists

### Artprice / Artmarket — licence B2B

**Objet : xArtists — demande de licence B2B de données et d'analyses du marché de l'art**

Bonjour,

xArtists prépare un service de rapports d'analyse originaux portant sur l'art, les œuvres numériques et physiques, les tendances agrégées, les risques et la provenance.

Nous aimerions connaître les possibilités de licence professionnelle B2B pour l'utilisation de données Artprice dans de telles analyses vendues par abonnement, sans revente de vos bases, API ou images. Merci de détailler les jeux et indicateurs disponibles, les dérivés commercialement autorisés, les obligations de citation, les droits des images, les volumes, la conservation et les modalités de preuve du contrat.

Merci de nous indiquer votre interlocuteur habilité et la procédure commerciale.

Cordialement,
L'équipe xArtists

### CoinGecko — confirmation du plan commercial

**Objet : xOrus — licence commerciale CoinGecko pour rapports d'analyse dérivés**

Bonjour,

Nous étudions un plan CoinGecko payant pour produire nos propres rapports dérivés de marchés, de risque et de DeFi, vendus par abonnement. Nous ne revendons ni vos flux bruts ni l'accès à votre API.

Pourriez-vous confirmer le plan adapté, les champs/volumes permis, les exigences d'attribution dans les rapports, les limites de conservation/caching ainsi que les conditions d'usage dans des traitements IA sans entraînement de modèle ? Aucun accès client commercial fondé sur ces données ne sera activé avant confirmation des droits effectifs.

Cordialement,
L'équipe xArtists

## Conditions minimales avant une seule activation

1. Licence valide ou droits natifs établis et périmètre d'analyse vendue examiné par un humain compétent.
2. Identité contractuelle, expiration, attribution, permis IA et conservation vérifiés sans exposer le contrat privé.
3. Provenance des observations, anti-falsification et corroboration indépendante déployées et testées.
4. PR distincte et revue qui épingle le contrat approuvé et modifie la liste commercial_ok sous supervision.
5. Parcours client avec compte, entitlement et rapport privé vérifié indépendamment ; pas de redistribution du feed.

Aucune de ces conditions n'est attestée par cette PR ; elle laisse toutes les sources commerciales bloquées.
