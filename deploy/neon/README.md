# xArtists — backend gratuit (Neon Functions), sans VPS et sans toucher au mail OVH

**Décision du 17 novembre 2026 :** le propriétaire n'a **ni VPS ni serveur dédié**. Conserver **GitHub Pages `xartists.art`** pour la dApp, **OVH Hébergement Web** et **MX Plan** pour les services existants, et **Neon Free** pour un premier endpoint HTTP sécurisé sans serveur à louer. Ne pas modifier les MX, DNS publics, boîtes mail ou domaine principal.

## Service de préproduction et limites

- Source `deploy/neon/readonly-api/index.mjs` : un **handler Node.js 24 / Fetch API** indépendant, sans import de l'API Node/Python historique. Projet connecté Neon : `xartists-access-sandbox` (**bac à sable**, pas la base de production). Fonction `xartistsfree`.
- Routes GET/HEAD : `/health`, `/v1/ops/build-info` ; `/v1/ops/studio-store/status`, `/v1/ops/orders-store/status`, `/v1/studio/media/config` refusent avec HTTP 503 ; autres routes 404 ; toutes mutations HTTP 405. Authentification, messagerie, fichiers et commerce restent inactifs.
- L'identité `service: xartists-neon-readonly-staging` **ne correspond PAS** à `access-api`. Les sondes de l'API réelle doivent échouer volontairement : aucune fausse certification. Aucune base n'est interrogée ; même si Neon injecte des secrets de branche, aucun endpoint ne les lit ou ne les révèle.
- CORS autorise uniquement `https://xartists.art` et `https://www.xartists.art`. Pas de wildcard, aucune authentification implicite. Les clients HTTP sans `Origin` peuvent lire les statuts publics.
- Ne PAS publier l'endpoint sous `api.xartists.art` ni renseigner `VITE_ACCESS_API_BASE` tant que toutes les routes nécessaires, la base et la sécurité n'ont pas été portées et auditées.

## Quotas et déploiement sans nouveaux frais

Le compte Neon connecté est au forfait **Free**. Au 17/11/2026, les Functions sont incluses sous quotas par projet : **1 million d'invocations par mois**, **10 heures de capacité active**, **400 heures de capacité en attente** ; PostgreSQL possède ses propres limites. L'épuisement peut interrompre le service ; pas de promesse de fonctionnement 24/7 ni de dépassement gratuit. **Ne jamais activer une offre payante**. Surveiller les quotas dans Neon. Sources : https://neon.com/blog/whats-new-with-the-neon-backend et https://neon.com/docs/introduction/free-tier.

1. Tester le code versionné : `node --test services/access-api/tests/neonFreeReadOnly.test.mjs`.
2. Après merge, produire un ZIP ne contenant que `index.mjs` à sa racine ; vérifier le contenu contre le fichier exact du commit sur GitHub.
3. Via **le connecteur Neon**, déployer manuellement dans **`xartists-access-sandbox`** (branche sandbox existante), runtime `nodejs24`, slug `xartistsfree`, avec uniquement la variable non sensible `XARTISTS_SOURCE_SHA` correspondant au commit réellement vérifié.
4. Vérifier le vrai endpoint HTTPS `/health`, `/v1/ops/build-info`, les protections CORS et les refus 405/503. Si région/quota non compatible, conserver le site statique et déclarer la publication **non réalisée**. Ne jamais faire de migration sur un sandbox pris pour la production.

## OVH : hébergement Web et messagerie

- L'export de renouvellements OVH du 17/11/2026 indique **un hébergement Web et un MX Plan**, mais pas la gamme ni les capacités du compte. Ne pas supposer de serveur ou d'IP.
- Sur mutualisé standard, les droits **root/Docker** ne sont pas disponibles. La gamme **Cloud Web** d'OVH propose une runtime Node.js configurable dans Manager, mais **nous n'avons pas vérifié que ce contrat est Cloud Web**. Une option sans coût additionnel n'existe que si la gamme actuelle la permet.
- Conserver la messagerie OVH ; pas d'envoi automatique depuis Neon ni de changement MX/SPF/DKIM/DMARC. La preuve d'émission/réception depuis `hello@xartists.art` reste un sujet séparé. Ne jamais confondre compte e-mail et compte utilisateur dApp.

## Future vraie API utilisateurs

Le backend `services/access-api/src/server.mjs` contient un serveur HTTP Node.js, PostgreSQL, fonctions Python, comptes et opérations NFT ; **il ne peut pas être déplacé tel quel** vers une Neon Function. Il faut porter progressivement, avec revue de sécurité, **authentification avec/sans wallet**, profils, données Studio privées, analyses dérivées, quotas et sauvegardes. Kubo, paiements, mint et trading restent OFF. Pas d'exposition de production sans base réelle identifiée, migrations autorisées, sauvegarde/restauration prouvées et gestion des secrets.

Documentation fournisseurs : https://neon.com/docs/functions/get-started et https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/ssh-on-webhosting.
