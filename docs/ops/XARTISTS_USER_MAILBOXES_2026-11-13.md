# xArtists Mail — boîtes personnelles @xartists.art

**13 novembre 2026 — préparation uniquement, NO-GO production.**

## Objectif

Un compte xArtists avec email vérifié (sans wallet obligatoire) peut demander une adresse personnelle `pseudo@xartists.art` et accéder à une **véritable boîte** : réception, dossiers, brouillons, pièces jointes, rédaction, envoi et réponse. Le wallet ne tient pas lieu de preuve de compte. Un alias de redirection ou un identifiant OTP n'est pas une boîte autonome.

## Infrastructure à confirmer

Le MX public `mail.xartists.art` pointe vers le VPS OVH `146.59.146.223`. L'instance et le logiciel gestionnaire réels (Postfix/Dovecot, Mailcow, Stalwart, Plesk, OVH MX Plan ou autre) ne sont pas encore certifiés. **Ne pas modifier le MX** avant inventaire, sauvegarde et plan de migration.

Choix possibles, après inventaire :
- [Mailcow API](https://docs.mailcow.email/manual-guides/mailcow-UI/u_e-mailcow_ui-api/) avec clé serveur privée, restriction IP et permissions minimales ; webmail protégé, connexion SSO prouvée.
- [Stalwart Mail](https://www.stalwart.email/docs/auth/accounts/manage/) avec JMAP et OIDC/SCIM, sous réserve d'un audit d'intégration Neon Auth et des sauvegardes.
- Postfix+Dovecot ou MX Plan existants, uniquement avec l'adaptateur de l'instance réelle.

## Première livraison dans le dépôt

- `services/access-api/src/mailboxProvisioning.mjs` : validation des noms, protections des noms réservés, vérification **serveur** du UUID de compte, origine autorisée, unicité, un seul provisionnement, aucun secret renvoyé.
- `services/access-api/src/mailboxRepository.mjs` et migration `20261113_xa_mailboxes_v1.sql` : réservation PostgreSQL atomique et audit des cas incertains `needs_reconciliation`. **Migration non appliquée** ; aucun contenu email stocké.
- `services/access-api/tests/mailboxProvisioning.test.mjs` : 7 tests offline.
- Plugin privé `xartists-mail` v0.1.0 (skill opérateur) : **pas d'accès MCP réel au serveur mail** pour le moment.

Aucune route de création active n'a été ajoutée à `server.mjs` ; le service est **fail-closed par défaut**, et ne fonctionne que lorsque `enabled=true`, vérificateur d'identité serveur, stockage réel, accès origine et fournisseur ayant prouvé la connexion à la boîte sont injectés. Un acquittement de fournisseur signifie `provisioned`, pas réception ni délivrabilité vérifiées.

## API / expérience visées, APRÈS raccordement validé

- `POST /v1/mailboxes` : authentification JWT Neon Ed25519 serveur, origine exacte, `{ "localPart": "pseudo" }`. **Aucun `user_id` fourni par le navigateur.**
- `GET /v1/mailboxes/me` : afficher son adresse et son état uniquement ; jamais d'email d'un autre compte.
- `/workspace/mail` : réserver le pseudo, se connecter au webmail SSO/JMAP/IMAP vérifié, lire/écrire sans faire transiter les secrets administrateur par le navigateur. Pas de faux messages.
- Contrôles : quotas, débit, anti-spam, consentement, sauvegarde/restauration, TLS, DKIM, SPF, DMARC, rétention RGPD, MFA des opérateurs, récupération, suspension, anti-usurpation.
- Un client A ne peut jamais consulter les dossiers du client B. Les privilèges admin provisionnent, ils ne lisent pas automatiquement le courrier.

## Gates avant GO

1. [ ] Inventaire MTA+IMAP/webmail OVH et autorisations administrateur.
2. [ ] Base `xa_user_accounts` de production vérifiée ; migration testée en base jetable et examinée DBA.
3. [ ] Auth Neon active, session vérifiée et SSO du fournisseur mail attesté.
4. [ ] Adaptateur fournisseur implémenté/testé, API avec authentification + limite de débit et journal sans contenu.
5. [ ] UX inbox réelle sécurisée, tests indépendance A/B, récupération et suppression.
6. [ ] Deux expéditeurs entrants indépendants et une réponse authentifiée, SPF/DKIM/DMARC prouvés.
7. [ ] Revue légale, abus, coûts/quota et politique de données.

La boîte commerciale `hello@` et l'issue #341 ne sont pas validées par ce module. Aucun fiat, mint, trade ni NFT live activé.
