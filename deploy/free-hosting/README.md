# xArtists — sortir de Render sans nouvel abonnement (14 novembre 2026)

**Décision proposée :** garder `https://xartists.art` sur GitHub Pages et déplacer
**seulement** `services/access-api` vers un hôte Docker déjà disponible,
ou une VM Oracle Cloud **Always Free** si un hébergement supplémentaire
réellement gratuit est nécessaire. **Aucune bascule n'est exécutée par ce dossier.**

Le dépôt dispose **déjà** de `services/access-api/Dockerfile`,
`deploy/ovh/compose.yaml`, `deploy/ovh/Caddyfile` et d'une CI
`ovh-api-parallel-ci.yml` vérifiant image + analyse Python hors ligne.
Ne pas réécrire le backend pour un hébergeur serverless.

## Trois options et leur vrai prix

| Option | Coût et contraintes constatés | Verdict |
| --- | --- | --- |
| Serveur OVH/maison **déjà payé** | **0 € de supplément** tant que CPU/RAM, réseau, sauvegardes, trafic et contrat existant suffisent. **Pas 0 € de coût total** si un serveur est facturé. | **1er choix** : conserver le Node HTTP + PostgreSQL + xOrus Python |
| **Oracle Cloud Always Free**, VM Arm | 0 € **dans les ressources éligibles** : 2 OCPU Arm / 12 Go RAM au total, quota de volumes 200 Go, région d'origine. Carte bancaire demandée pour vérification ; capacité Arm non garantie ; récupération possible de VM inactives ; le hors quota et les options payantes ne sont pas gratuits. | **2e choix** : vraie VM Docker sans abonnement si éligible |
| **Koyeb Free** | Une instance 0,1 vCPU / 512 Mo / 2 Go, sans volume persistant, mise en veille après 1 h d'inactivité ; pas conseillé pour une API commerciale en production. | Test temporaire uniquement |

**Ne PAS sélectionner :**
- Vercel **Hobby** pour xArtists commercial : ses conditions limitent cet abonnement gratuit à un usage personnel **non commercial** ;
- Akash comme « gratuit à vie » : l'essai comprend seulement des crédits temporaires, les leases consomment des fonds ;
- Cloudflare Workers Free comme migration Docker directe : le plan gratuit impose 10 ms de CPU par requête et ne peut exécuter tel quel le serveur Node HTTP + subprocess Python ;
- Render Free Postgres comme stockage durable : la base gratuite expire après 30 jours. Le but est précisément de découpler l'API.

Sources des offres, à revalider avant réservation (les conditions changent) :
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingup_topic-Sign_Up_for_Free_Oracle_Cloud_Promotion.htm
- https://www.koyeb.com/docs/reference/instances
- https://vercel.com/docs/plans/hobby
- https://akash.network/docs/getting-started/quick-start/
- https://developers.cloudflare.com/workers/platform/limits/
- https://neon.com/docs/introduction/pro-plan (pour les tarifs Neon, utiliser leur grille actuelle)

## Architecture sans hébergement frontend payant

```text
Visiteur / artiste
       |
       +--> https://xartists.art (GitHub Pages existant, inchangé)
       |
       +--> https://api.xartists.art (DNS à configurer après preuve)
                     |
               Caddy HTTPS (Docker)
                     |
               Node 22 Access API :8787 (réseau interne uniquement)
                     |
                  PostgreSQL vérifié, séparé
                     |
                xOrus Python read-only (embarqué dans l'image)
```

Les boîtes e-mail `@xartists.art`, les traitements lourds de photogrammétrie
et le stockage des médias/IPFS restent des services **distincts**. Le serveur
ne crée pas de boîtes e-mail, n'autorise pas le mint et ne fournit aucune licence
d'utilisation des données tiers à lui seul.

## Procédure A — serveur OVH existant : 0 € supplémentaire si ressources disponibles

1. Contrôler **hors ChatGPT** la propriété, l'accès SSH, la capacité CPU/RAM/disque,
   les sauvegardes, le droit d'héberger une API et les ports entrants 80/443.
   Si le serveur héberge la messagerie, ne pas écraser sa configuration actuelle
   ni prendre ses ports 80/443 sans contrôle d'interférence ; utiliser un reverse
   proxy existant ou une VM séparée selon le plan.
2. Préparer le sous-domaine **staging** `api-staging.xartists.art` (A/AAAA
   correct) sans modifier les A records GitHub Pages de `xartists.art`.
   Garder `api.xartists.art` libre jusqu'au GO contrôlé.
3. Installer Docker Engine + Compose v2 **sur le serveur approuvé** (aucun
   identifiant, root, token, PEM, seed ou DSN ne doit être collé dans ChatGPT).
4. Sur le serveur, récupérer le SHA Git exact et créer le fichier privé :

   ```bash
   git clone https://github.com/Neltud/xArtists.git
   cd xArtists
   git rev-parse HEAD
   cp deploy/ovh/api.env.template deploy/ovh/.env.api
   # Modifier .env.api sur le serveur, hors dépôt :
   # XARTISTS_SOURCE_SHA=<git rev-parse HEAD>
   # CORS_ORIGIN=https://xartists.art
   # ACCESS_JWT_SECRET=<valeur secrète longue et unique>
   # DATABASE_URL=<DSN de la vraie base vérifiée, pas le sandbox>
   # Laisser MINT_LIVE_ENABLED=0, MINT_DRY_RUN=1, PAYBOX_CHECKOUT_ENABLED=0,
   # CREATOR_MEDIA_UPLOAD_ENABLED=0, LIA_LIVE_TRADING=0.
   export API_HOSTNAME=api-staging.xartists.art
   docker compose -f deploy/ovh/compose.yaml config --quiet
   docker compose -f deploy/ovh/compose.yaml up -d --build
   docker compose -f deploy/ovh/compose.yaml ps
   ```

5. Exécuter le contrôle de préproduction depuis un réseau extérieur, sans
   s'authentifier ni envoyer de données personnelles :

   ```bash
   node scripts/ops/probe-free-api-candidate.mjs \
     --url https://api-staging.xartists.art \
     --sha "$(git rev-parse HEAD)"
   ```

   Le contrôle fait uniquement 4 GET (health, build-info, schéma Studio,
   commandes). Il refuse une identité SHA divergente, un origin non approuvé,
   un contenu inattendu ou tout flag financier/transactionnel activé.
   Un `studio_schema: not_ready` reste un vrai **NO-GO upload**, même si
   la santé HTTP est positive. **La commande ne déploie rien.**

## Procédure B — zéro serveur existant : VM Oracle Cloud Always Free

1. Créer **un seul compte** éligible dans la région d'origine choisie
   (`https://signup.oraclecloud.com`) ; carte demandée pour vérification.
   **Ne jamais accepter une mise à niveau payante**, service hors quota ou
   ressource facturable pour satisfaire cette procédure.
2. Dans OCI, provisionner **uniquement une VM Arm Ampere A1 étiquetée Always
   Free** (par exemple 2 OCPU et 12 Go, *si disponible*), et un volume de boot
   éligible dans les quotas gratuits. Ne pas provisionner de load balancer,
   NAT gateway ou IP réservée payante sans audit de prix.
3. OS Ubuntu Arm64, sécurité du réseau OCI et pare-feu système : ports
   80/443 accessibles pour Caddy/TLS ; SSH restreint aux IP approuvées ;
   aucun port 8787 ou PostgreSQL exposé. Ne pas faire de build sensible
   sur l'instance avant mise à jour système et protections.
4. Installer Git + Docker Engine/Compose v2 selon la documentation officielle
   Docker Ubuntu. **Réutiliser exactement** `deploy/ovh/compose.yaml` :
   ce dossier n'est pas spécifique au fournisseur. La CI Docker existante
   vérifie l'image principalement en environnement x86 ; sur OCI **Arm64**,
   construire et tester sur la VM Arm elle-même avant de déclarer la
   compatibilité prouvée, notamment les modules npm et le worker Python.
5. Suivre la procédure A sur cette VM, avec le **même nom de staging**, les
   mêmes garde-fous et le même contrôle SHA. Vérifier la consommation OCI et
   configurer un budget/alertes ; les alertes ne sont **pas** une garantie
   de plafonnement des coûts. Les instances inactives peuvent être récupérées :
   vérifier la stratégie de sauvegarde hors VM.

### Base de données sans abonnement supplémentaire

Garder une vraie PostgreSQL **existante et indépendamment identifiée** si son
contrat/quota l'autorise. Neon Free a une offre à quotas, mais le projet
`xartists-access-sandbox` **n'est pas une preuve de DB de production**.
Ne pas recopier une URL Render, modifier le schéma, appliquer les migrations
004–006 ni migrer des données clients avant un backup chiffré, un restore
testé et une autorisation explicite. Si aucune base durable autorisée
n'existe, l'API peut être testée en **lecture seule** avec les fonctions
non certifiées OFF : **cela ne termine pas Studio**.

## Bascule : uniquement après validation et rollback

- Relire sur le **runtime candidat** : HTTPS, `/health`,
  `/v1/ops/build-info`, `/v1/ops/orders-store/status` et
  `/v1/ops/studio-store/status`. Vérifier le SHA et la base sous le contrôle
  de son propriétaire ; status `200` ≠ bonne identité SQL.
- Prouver les chemins SIWX expiré/refusé, CORS `https://xartists.art`,
  QR xPortal réel, session walletless uniquement si son fournisseur et ses
  tables sont certifiés ; tests sans signature ni paiement.
- Préparer `api.xartists.art` sur le nouveau serveur et vérifier le certificat.
  **Avant** changement `VITE_ACCESS_API_BASE`, revoir aussi les politiques
  CSP `connect-src` des assets générés GitHub Pages et tous les callbacks
  webhook/OTP/signature. Les URLs Render codées en dur nécessitent des PRs
  de migration par module, non un remplacement global aveugle.
- Mettre à jour la variable publique GitHub Actions `VITE_ACCESS_API_BASE`
  **seulement après approbation propriétaire + recette SHA + rollback**,
  puis reconstruire/déployer Pages et vérifier le SHA réellement publié.
- Conserver Render comme fallback pendant une fenêtre de contrôle, puis
  le désactiver une fois les traces, secrets et intégrations réconciliés.
  **Ce dossier ne supprime pas Render.**

## Conditions d'arrêt

STOP si hôte payant/quotas incertains, capacité insuffisante, ports en conflit
avec mail/web, domaine non contrôlé, Caddy sans TLS fiable, SHA incohérent,
base non identifiée, migrations non revues, secrets divulgués, source commerciale
sans droit, ou flags paiement/mint/trading différents des valeurs paper.
Aucun indicateur de santé ne vaut preuve d'achat NFT ou d'envoi d'e-mail.
