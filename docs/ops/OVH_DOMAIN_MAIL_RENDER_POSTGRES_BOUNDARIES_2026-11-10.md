# xArtists — OVHcloud domaine/mail et frontières des bases (PREP, 10/11/2026)

**Architecture retenue : OVHcloud gère le domaine xartists.art, sa zone DNS, la messagerie commandée et un éventuel hébergement web complémentaire. Le backend, les comptes, les commandes et les abonnements xArtists continuent sur Render et PostgreSQL.** Aucun changement DNS, transfert de base, création de base, paiement ou mint autorisé par ce document.

## État observé vs hypothèses

- Capture du propriétaire du **10 novembre 2026 à 18 h 24 (Europe/Paris)** : OVHcloud a enregistré une commande comprenant renouvellement **12 mois de xartists.art**, zone DNS, **1 boîte mail** et **hébergement web 100 Mo**. Le statut visible du paiement était **« en cours de validation »**. Il ne prouve pas commande livrée, disparition du clientHold, zone DNS fonctionnelle, création effective de boîte mail ni adresse hello@.
- Ancien contrôle public du **3 novembre** : xartists.art retournait **NXDOMAIN**. Ne pas prendre ce constat historique pour l'état actuel ; exécuter une nouvelle sonde après livraison de la commande.
- Au contrôle du **10 novembre**, les routes publiques [orders store](https://xartists-access-api.onrender.com/v1/ops/orders-store/status) et [mint jobs store](https://xartists-access-api.onrender.com/v1/ops/mint-jobs-store/status) ont répondu avec ok=true, backend=postgres, table_ready=true. Le backend Render joint un serveur PostgreSQL contenant les deux noms de table. **L'instance fournisseur, les privilèges, les sauvegardes, la restauration et la capacité de livraison ne sont pas certifiés.**
- Selon le [guide OVHcloud officiel](https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/sql-create-database.md) (mise à jour 3 juin 2026), les bases incluses dans les hébergements web classiques sont **MySQL**, port **3306**, avec accès depuis les scripts de cet hébergement ou phpMyAdmin ; jusqu'à **30 connexions simultanées** et snapshots quotidiens (jusqu'à 32). Ces chiffres concernent l'hébergement OVH classique, **pas** PostgreSQL sur Render. Le forfait web 100 Mo commandé ne prouve pas qu'une base MySQL y soit incluse.

## Architecture cible — services distincts

| Périmètre | Service | Préconditions |
|---|---|---|
| Registrar, NS, DNS, renouvellement | **OVHcloud** | Commande livrée, état du registre sans hold, délégation DNS validée |
| Messagerie hello@xartists.art (si créée par le propriétaire) | **OVHcloud mail** | Provisionnement, MX réels de l'offre, SPF/DKIM/DMARC, envoi et réception vérifiés |
| Domaine commercial public xartists.art / www | **Zone OVH vers frontend existant** à choisir après recette | Méthode CNAME/A et HTTPS de l'hébergeur frontend, inventaire de zone avant changement |
| Vitrine, musée, dApp frontend | **GitHub Pages et/ou service frontend Render actuel** | Source canonique à figer, routes SPA et certificats TLS vérifiés |
| Backend API, authentification, commandes, preuve de livraison | **Render xartists-access-api** | Accès contrôlés et chemins de vente fermés tant que non certifiés |
| Utilisateurs, commandes, abonnements, jobs | **PostgreSQL effectivement configuré dans Render** | Identité de la base à attester sans divulguer le DSN, sauvegarde/restauration et idempotence |
| Hébergement OVH 100 Mo | **Complément facultatif**, non requis pour la dApp | Page statique ou redirection vérifiée si pertinent, jamais API/clé JWT/ledger de paiement |
| Médias NFT/IPFS | **Stockage IPFS distinct** | Pins, CIDs, droits, octets vérifiés, sauvegardes et signatures séparées |

**Ne pas créer une base MySQL OVH pour « réparer » PostgreSQL.** Ne pas établir de double ledger ni copier des secrets ou des chaînes DATABASE_URL dans GitHub. Les tests Stripe offline restent possibles sans la base OVH.

## Étapes du propriétaire OVH (sans secrets partagés)

1. **OVHcloud → Mes commandes** : contrôler paiement validé puis commande livrée. Vérifier expiration et statuts du registre (clientHold/serverHold). Un renouvellement enregistré ne suffit pas.
2. **Web Cloud → Noms de domaine → xartists.art** : contrôler les serveurs DNS délégués et l'état de la zone. Avant toute modification, sauvegarder l'inventaire des enregistrements A/AAAA/CNAME/MX/TXT/CAA. **Ne pas remplacer les NS ou A/CNAME sur la base d'exemples génériques.**
3. Lancer le contrôle public **en lecture seule** : commande shell « node scripts/ops/ovh-domain-dns-preflight.mjs ». Le rapport distingue délégation NS/SOA, résolution A/AAAA, MX, SPF, DMARC. Même si mail_dns_candidate_only vaut true, la boîte n'est pas réputée livrable.
4. **Web Cloud → Emails / MX Plan / offre mail** : vérifier quel service mail est réellement provisionné et créer, si disponible et choisi, la boîte ou l'alias hello@xartists.art. Ne transmettre aucun mot de passe à ChatGPT.
5. Recueillir les **valeurs exactes** de MX/SPF/DKIM fournies par cette offre OVH ; configurer DMARC selon les recommandations du fournisseur. Ne jamais inventer les MX, écraser un SPF existant ni publier une clé privée. Le sélecteur DKIM reste à identifier chez le fournisseur.
6. Depuis **deux expéditeurs externes distincts**, envoyer des essais vers hello@, observer la réception et renvoyer une réponse. Vérifier spam et authentification SPF/DKIM/DMARC. Ne mettre aucun email privé ou donnée personnelle dans une issue publique.
7. Seulement ensuite proposer une PR de la page de contact. L'état historique du site renvoie vers un formulaire GitHub public ; ne le remplacer par un mailto que lorsque le canal est réellement testé, avec revue HTTPS, mobile et confidentialité.

## Sonde DNS et CI — sécurité et limites

- [Sonde publique](../../scripts/ops/ovh-domain-dns-preflight.mjs) : uniquement requêtes DNS NS, SOA, A, AAAA, MX, TXT et _dmarc.TXT sur xartists.art. Rapport de statuts **sans afficher les valeurs TXT**.
- [Tests hors ligne](../../scripts/ops/ovh-domain-dns-preflight.test.mjs) : NXDOMAIN, records malformés, SPF/DMARC dupliqués, erreurs DNS, absence de site et non-confusion DNS/délivrabilité. Aucun secret, SMTP, OVH API ni base externe.
- Workflow GitHub « OVH domain DNS preflight — read-only » : tests sur PR ; interrogation DNS réelle **sur déclenchement manuel seulement**, sans mutation.
- **Fail closed** : même si DNS répond, les attributs production_contact_ready, email_delivery_and_reply_verified, registrar_clienthold_cleared_verified et ovh_mysql_is_render_postgres restent à false. Le statut RDAP du registre et la délivrabilité ne sont pas vérifiés par ce script.

## Dossiers indépendants

- **Issue #341** : domaine/contact reste ouverte jusqu'aux preuves de boîte et de réponse.
- **Issue #281** : comparaison du fournisseur et nom de base PostgreSQL Render dans les consoles privées ; ne communiquer qu'une attestation **sans** hostname privé, utilisateur ou DSN.
- **PR #478** : les objectifs Pulse / Yield / Sentinel **33 / 22 / 11 EGLD** et les abonnements Stripe services-only **3,79 / 5,79 / 9,79 €/mois** restent non exécutables. L'ancien modèle dans main est obsolète.
- **Stripe / MoonPay / PayBox / Finance Computer** : aucun checkout, paiement, abonnement, mint, signature ou changement de contrat via cette préparation OVH.

**Conclusion : NO-GO contact commercial par email, NO-GO paiements et NFT, jusqu'aux attestations séparées.**
