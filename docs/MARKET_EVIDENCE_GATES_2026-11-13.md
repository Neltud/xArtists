# Marchés xArtists — contrat d'intégrité des chiffres (13 novembre 2026)

## Pourquoi ce correctif P0 ?

L'ancien `apps/frontend/src/lib/marketData.ts` retournait, quand les APIs étaient indisponibles :
- des prix BTC/ETH/SOL et autres actifs provenant de `data/market_snapshot.json`, fichier de démonstration daté du 4 septembre 2026 ;
- une fausse matrice de corrélation (0,72, 0,55, etc.) lorsque l'historique manquait ;
- de faux taux funding BTC/ETH/SOL ;
- un score F&G neutre 50 malgré l'absence du fournisseur ;
- une date `updatedAt` de la consultation navigateur, confondue avec la date de production d'un cours.

Ces nombres auraient été incompatibles avec un produit d'aide à la décision vendu comme réel. **Un écran agréable ne compense pas une preuve manquante.**

## Règles codées

- **Prix :** `last_updated` du fournisseur obligatoire, frais ≤15 minutes, date future >60 s refusée, valeur finie strictement positive, variation 24 h finie.
- **Sentiment :** observation F&G 0..100, timestamp fournisseur horodaté ≤48 h ; pas de score neutre inventé.
- **Funding :** valeur réelle bornée, sinon liste vide. Aucune moyenne à 0 si l'API manque.
- **Corrélation :** au moins deux séries valides ; sinon tableau vide. Aucun nombre exemple requalifié en mesure.
- **Agrégat :** si le fournisseur du sentiment ou des prix manque, `loadMarketSnapshot()` échoue et l'interface affiche les données indisponibles ; elle n'utilise plus la photographie de démonstration.
- **Publication :** le timestamp affiché est celui du cours le plus ancien accepté, pas `Date.now()`. Une visite n'actualise pas la source.
- **Trading :** la lecture de cours ne renseigne **aucun** signal certifié dans `lia/xorus/decision_agent.py`. La décision reste `ABSTAIN` tant que l'essaim ne dispose pas de preuves de provenance, licence et fraîcheur suffisantes.

## Blocage commercial

CoinGecko exige un plan adapté aux usages commerciaux et une attribution visible. L'usage API gratuit/Demo ne vaut pas droit de vendre un produit de données ; la redistribution des flux exige un accord supplémentaire : https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses

Le lien public `Data provided by CoinGecko` est présent à titre de transparence, **pas** de certification d'une licence. Avant offres payantes xOrus : contrat de droits source, distinction service d'analyse vs data pack, registre des entitlements, traitement de la révocation, et tests de fourniture de service.

## Portée de la livraison

Ce correctif supprime les **cotes fabriquées** de la route Marchés. Il ne crée pas d'abonnement, ne collecte pas de paiement, ne publie pas d'ordres et ne transforme pas une API gratuite en source licitement revendable.
