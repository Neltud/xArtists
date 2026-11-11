# xArtists — email et comptes utilisateurs — vérification du 11/11/2026

**Statut : PREP / NO-GO publication de l'adresse et authentification réelle.**
Le canal email business et les comptes de clients sont deux infrastructures distinctes. Les utilisateurs peuvent avoir une identité email sans wallet ; les emails transactionnels ne sont pas des boîtes individuelles chez OVH.

## Faits DNS publics constatés le 11 novembre 2026

Contrôle DNS-over-HTTPS (Google Public DNS) :
- NS : `ns107.ovh.net`, `dns107.ovh.net`.
- A apex : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages).
- MX : priorité **1** vers `mail.xartists.art` ; A de ce serveur `146.59.146.223`.
- SPF : `v=spf1 a mx a:mail.xartists.art -all`.
- DMARC : `v=DMARC1;p=reject;rua=mailto:adminsys@xartists.art;sp=reject;aspf=s;`.

Ce résultat remplace le constat **NXDOMAIN du 03/11** dans `CONTACT_CHANNEL_READINESS_2026-11-03.md` ; il ne prouve ni l'existence de `adminsys@`, ni celle de `contact@`, ni la bonne configuration SMTP, TLS, DKIM ou la délivrabilité. Les MX observés **ne sont pas nécessairement ceux du MX Plan OVH** : identifier le service réel avant toute modification DNS. Ne pas remplacer des MX en service par des valeurs génériques.

Contrôle reproductible : `node scripts/ops/check-xartists-mail-dns.mjs` ; tests sans réseau : `node --test scripts/ops/check-xartists-mail-dns.test.mjs`. Le statut `mailbox_verified` reste volontairement `false`, même si le DNS est complet.

## Adresses métier demandées — à créer seulement chez le bon hébergeur

| Adresse | Usage | Mise en œuvre | Publication |
|---|---|---|---|
| `contact@xartists.art` | Contact commercial et institutionnel | Boîte réelle prioritaire ou alias surveillé vers une boîte réelle | Après test de réception et réponse |
| `support@xartists.art` | Support client privé | Boîte partagée ou alias vers une boîte de support tracée | Après test |
| `noreply@xartists.art` | Expéditeur technique de notifications | Identité d'expédition d'un prestataire transactionnel authentifié ; ne pas créer une boîte réceptrice sauf besoin | Après SPF/DKIM/DMARC et tests |
| `security@xartists.art` | Signalement sécurité | Boîte surveillée par opérateur responsable | Après test |
| `adminsys@xartists.art` | Réception des rapports DMARC | Vérifier d'abord le destinataire publié dans `rua` (ou modifier DMARC après arbitrage) | Ne pas publier comme contact public |

Éviter de créer une adresse OVH distincte pour chaque client : les comptes dApp sont dans le fournisseur d'identité + PostgreSQL xArtists, pas des comptes de messagerie OVH. Prévoir RGPD, conservation limitée, accès opérateur et MFA.

## Reprise OVH — aucune manipulation dangereuse sans authentification

1. Depuis la console propriétaire, identifier si `mail.xartists.art` correspond à un serveur mail auto-hébergé, un service OVH ou un tiers ; confirmer licence, nombre de boîtes disponibles et sauvegarde existante.
2. Si l'offre est **MX Plan OVH**, `Web Cloud > MX Plan > service > Comptes e-mail > Ajouter`, suivant la documentation fournisseur : https://docs.ovhcloud.com/fr/guides/web-cloud/email-and-collaborative-solutions/mx-plan/email-creation . Sinon utiliser la console de l'hébergeur effectif. Ne pas changer les MX sans plan de migration et validation.
3. Créer `contact@` en premier, puis `support@` et `security@` selon capacité ; configurer `noreply@` séparément côté prestataire d'envoi. Les secrets restent hors GitHub, hors conversation et hors navigateur public.
4. Identifier le sélecteur DKIM et vérifier ses TXT, le serveur SMTP d'envoi, TLS, PTR/rDNS et la cohérence SPF/DMARC ; ne pas supposer DKIM parce que DMARC est publié.
5. Envoyer deux emails depuis des domaines externes indépendants vers `contact@`, confirmer leur présence et répondre depuis `contact@`. Vérifier les en-têtes et la délivrabilité ; faire de même avec `support@`.
6. Enregistrer un **verdict opérateur** hors données personnelles (date, service, résultat) avant de remplacer le contact GitHub public en production. Ne pas inventer de tests ni déclarer une boîte « créée » sur la seule base d'un MX.

## Comptes dApp sans wallet, avec association facultative

La source de vérité est l'identifiant serveur `xa_user_accounts.id`. L'adresse email n'est jamais un propriétaire de NFT, un wallet saisi n'est jamais une preuve de propriété, et une validation DNS n'est pas un mécanisme de login.

- **Sans wallet** : identité email confirmée et session active émises par le fournisseur d'authentification ; espace client et brouillons accessibles selon permissions serveur ; aucune obligation d'installer un wallet.
- **Wallet lié** : utilisateur déjà authentifié + challenge MultiversX SIWX signé sur le compte choisi, nonce unique, domaine, chainID, expiration, preuve vérifiée côté serveur, contrainte UNIQUE sur l'adresse ; les données et abonnements restent attachés à l'ID utilisateur.
- **Dissociation** : reconnexion récente et vérification anti-takeover ; empêcher la suppression de la dernière méthode de récupération ; ne jamais déplacer une identité NFT on-chain par une simple modification de compte.
- **Fiat / EGLD** : abonnement EUR PSP avec webhook vérifié et révocation, ou achat EGLD signé par le wallet ; ni redirection checkout ni JWT ni liaison de wallet n'accordent de NFT ou de droits payants.

État réel du code : `accountTypes.mjs` et `accountRepository.mjs` sont sur main, mais restent des primitives internes ; PR #480 ajoute un vérificateur JWT Neon **en draft**, sans endpoint public. Les critères d'activation demeurent #465 et les gates commerciales #281/#328.

## Critères GO indépendants

- [ ] Boîte de contact réellement créée chez le fournisseur déterminé et tests inbound/outbound réussis.
- [ ] DKIM vérifié sur sélecteur en vigueur ; conformité DMARC démontrée sur envois de test ; `adminsys@` de `rua` opérationnel ou remplacé par un collecteur vérifié.
- [ ] Auth Neon production choisie, email vérifié, sessions/révocations, reset, MFA opérateur et protections anti-abus testés.
- [ ] Vérification wallet SIWX et unlink sécurisés, migrations, tests inter-comptes et audit sécurité.
- [ ] Mise à jour publique **seulement après** preuves de livraison et tests sur SHA réellement déployé.
