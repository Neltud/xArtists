---
description: "Service Render frontend vérifié ; configuration cible de l'access-api sandbox, sans changement d'infrastructure."
---

# Render — frontend existant et cible access-api

Relevé du 28 octobre 2026 à 18:16 Europe/Paris. Lecture seule des métadonnées Render, du code GitHub et de deux URL HTTP ; aucun secret demandé et aucun POST exécuté.

## Service réellement déployé

| Champ | Valeur vérifiée |
|---|---|
| Workspace | My Workspace |
| Service | xArtists services and products |
| Dashboard | [Service Render](https://dashboard.render.com/web/srv-dbh2c4m7bikc73ei0omg) |
| URL | `https://xartists-services-and-products.onrender.com` |
| Runtime | `docker` |
| Racine | Vide, donc racine du dépôt |
| Dockerfile | `./Dockerfile` |
| Plan de l'instance | `free` ; le champ distinct `buildPlan:starter` ne signifie pas que l'instance est payante |
| Région | Frankfurt |
| Branche | main |
| Auto-deploy | Oui, à chaque commit |
| HTTP health path | Non configuré |
| Déploiement live | `dep-dbh2c5e7bikc73ei0rmg`, déclenchement manuel |
| SHA déployé | `5c2c053d476837b3f30e8f87df4817e54cb8c71e` |

Le [Dockerfile de ce SHA](https://github.com/Neltud/xArtists/blob/5c2c053d476837b3f30e8f87df4817e54cb8c71e/Dockerfile) construit `apps/frontend`, copie le résultat sous `/usr/share/nginx/html/xArtists`, démarre nginx et expose le port 80. Son bloc de route racine renvoie un 302 vers `/xArtists/`. Il ne démarre pas `services/access-api/src/server.mjs`.

| Requête réellement exécutée | Réponse, sans suivi des redirections |
|---|---|
| GET `/health` | 302, `Content-Type:text/html`, corps nginx |
| GET `/v1/checkout/quote` | 302, `Content-Type:text/html`, corps nginx |
| En-tête Location commun | `http://xartists-services-and-products.onrender.com/xArtists/` |

Le GET quote n'est pas un test du contrat POST quote. L'identité du workload est établie par la combinaison de la configuration Render, du Dockerfile déployé et des réponses HTTP. L'outil web n'a pas pu ouvrir cette URL ; les réponses ci-dessus ont été obtenues par un client HTTP direct avec redirections désactivées. Aucune sonde d'une URL API supposée n'a été faite.

## Cible proposée, non créée

| Champ | Configuration de préparation |
|---|---|
| Service | `xartists-access-api`, distinct du frontend existant |
| Runtime / Language | Node, pas le Dockerfile racine nginx |
| Root Directory | `services/access-api` |
| Build Command | `npm ci --ignore-scripts`, après correction du lock et validation |
| Start Command | `npm start` |
| Node | Node 24 LTS proposé ; valider le candidat complet et aligner la CI |
| Instance | Free, quotas et dépassements vérifiés pour le budget 0 EUR |
| Région | Frankfurt |
| Health Check Path | `/health` |
| Port | Utiliser `PORT` fourni par Render ; ne pas copier le port nginx 80 |
| Déploiement | Manuel, SHA approuvé et attesté |

Variables préparées : `DATABASE_URL` côté serveur, `ACCESS_JWT_SECRET` généré et stocké de façon sécurisée, `CORS_ORIGIN=https://neltud.github.io`, `ACCESS_PUBLIC_BASE=https://neltud.github.io`, `REQUIRE_SIWX=1`, `LIA_LIVE_TRADING=0`, version Node validée. Aucun credential marchand, PEM ou signataire réel ajouté. Ne jamais coller l'URI ou le secret dans GitBook, un commit ou un message Grok.

Si le frontend Render devient le frontend utilisé, son origine doit être traitée explicitement par la politique CORS de l'API. Le code courant renvoie une seule origine configurée ; une liste séparée par des virgules n'est pas un en-tête CORS valide. Le paramétrage Pages ci-dessus reste cohérent avec le frontend public retenu.

## Prérequis toujours ouverts

1. Le lock API sur main reste de 351 octets, blob `64bdf09eef7bbd3cc5fc5af7e7d36ec392aa21b5` ; le workflow Pages échoue avec `npm ci`. Une nouvelle PR doit restaurer le lock complet et corriger les deux tests async. Utiliser `npm install` en déploiement ne corrige pas ce défaut de reproductibilité.
2. La dernière CI Paybox pré-merge #200 reste 59/61 ; ce chiffre n'est pas une nouvelle exécution sur main. Les contenus concernés sont encore présents sur main au relevé.
3. Node 20 est hors support ; Node 24 est proposé avec validation, pas présenté comme déjà migré.
4. Le `/health` actuel déduit `orders_backend` de `DATABASE_URL`, sans requête SQL. Une réponse JSON `postgres` ne prouve pas que le store fonctionne ni qu'il persiste au restart.
5. L'auto-deploy actuel du frontend est un écart au protocole de déploiement manuel. Il a été constaté, pas changé.

## Recette à exécuter après prérequis et autorisation applicable

- URL réelle fournie par Render, pas une URL déduite du nom souhaité.
- GET `/health` : **200 sans redirection**, type JSON et `service:access-api`, SIWX activé, live trading à 0, paiements marchands désactivés.
- POST quote sur les trois packs : montant attendu et calcul paper. Le taux client de fixture ne valide pas une cotation marchande.
- POST checkout sans JWT : 401. Après vraie authentification sandbox, absence de secrets Paybox : 501 sur checkout ; le challenge SIWX est un autre endpoint.
- Recette Postgres isolée et persistante avant de qualifier le store de prêt ; pas de validation par le seul `/health`.
- Mise à jour `VITE_ACCESS_API_BASE` avec l'URL **API** et rebuild Pages uniquement après validation et autorisation applicable.

Render accepte des réponses 2xx ou 3xx pour ses contrôles HTTP et utilise par défaut un contrôle TCP. Un service nginx `live` et un `/health` qui redirige peuvent donc ne pas être signalés comme en panne par la plateforme ; la recette doit vérifier le contrat JSON.

Sources officielles : [Web Services](https://render.com/docs/web-services), [Health Checks](https://render.com/docs/health-checks), [Deploys](https://render.com/docs/deploys), [versions Node.js](https://nodejs.org/en/about/previous-releases). Les références Markdown Render ont été tentées puis les versions HTML lues, le lecteur web n'acceptant pas le type `text/markdown`.

Aucune création de service, modification de configuration, lecture de secrets, connexion SQL, migration, variable GitHub, déclenchement de workflow ou déploiement effectué par ChatGPT. Le prompt GitBook est un passage de relais, pas un message directement envoyé à Grok.
