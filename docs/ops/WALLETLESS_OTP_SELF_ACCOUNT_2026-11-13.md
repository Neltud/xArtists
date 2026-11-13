# xArtists — Compte e-mail et profil sans wallet (13 novembre 2026)

**État :** code candidat, parcours de test livré ; aucune inscription réelle activée en production. Aucune écriture effectuée sur les bases Neon/Render dans ce sprint.

## Parcours prêt côté code

1. `/workspace/account`, alias `/account` et `/compte` : espace utilisateur séparé de `/workspace/identity` (identité blockchain). Liens depuis le dialogue d'accès simplifié et `/offres`.
2. La page lit `GET /v1/commercial/catalog` et n'autorise **aucune requête OTP** tant que `walletless_account_session_enabled` n'est pas vrai **et** `VITE_NEON_AUTH_URL` n'est pas un point Auth `https://*.neonauth.*.neon.tech/{database}/auth` explicitement paramétré dans Pages.
3. Le navigateur poste l'email à Neon Managed Auth `/email-otp/send-verification-otp` puis le code à `/sign-in/email-otp` avec cookies gérés par le fournisseur, sans transmettre le code à xArtists.
4. Après preuve OTP, le navigateur consulte Neon `/get-session` : seul un **JWT à 3 segments** reçu via la session ou l'en-tête prévu est transmis immédiatement en Bearer à `POST /v1/account/session`, puis à `GET /v1/account/me`. Pas de token dans URL, logs, `localStorage` ni `sessionStorage`; aucun mot de passe n'est collecté par xArtists.
5. Le backend vérifie Ed25519, l'émetteur, l'audience, l'expiration, la confirmation email et le statut du compte. `POST /session` retrouve/crée un UUID applicatif ; `GET /me` n'effectue **aucune création**, ne donne que UUID, type walletless/wallet_linked et nombre de wallets liés. Pas de secret, email, wallet adresse, identifiant Stripe ou abonnement renvoyé.
6. L'écran indique explicitement que les droits abonnements / analyses xOrus sont **non vérifiés** et qu'aucune transaction, signature, mint ni permission d'achat ne peut en résulter. Les wallets exigent une preuve SIWX distincte.

## Nouvelle preuve du schéma

`createWalletlessSchemaProbe` exécute un `SELECT to_regclass` en lecture seule, mis en cache 15 secondes et partagé entre requêtes simultanées. Il exige `xa_user_accounts`, `xa_account_identities`, `xa_account_wallets` et `xa_fiat_subscriptions` avant de déclarer le compte disponible. Les routes `/v1/account/session` et `/v1/account/me` refusent toute opération si ces tables manquent. `GET /v1/commercial/catalog` expose `walletless_account_session_enabled=false` si la connexion échoue ou si le schéma manque. Le diagnostic public n'expose ni noms de serveur privé, DSN, utilisateurs ni données client.

Les verrous de l'API existants restent obligatoires :
- `WALLETLESS_ACCOUNT_SESSION_ENABLED=1` ;
- `WALLETLESS_DATABASE_TARGET_CONFIRMED=1` ;
- `NEON_AUTH_BASE_URL` serveur fixé sur l'instance Neon Auth réellement approuvée ;
- `DATABASE_URL` du véritable stockage applicatif approuvé.
- `VITE_NEON_AUTH_URL` est une URL **publique** du même service côté frontend, laissée vide par défaut dans le build ; elle n'est jamais un secret ni une autorisation.

**Ces variables ne sont pas activées par ce changement.** Une réponse 200 de `/health` ou une URL Neon existante ne prouvent pas la compatibilité de la base liée.

## Diagnostic d'infrastructure en lecture seule

Le workspace Render contrôlé possède deux services web Docker xArtists mais **aucune instance PostgreSQL Render listée**. La sandbox Neon `xartists_access` dispose d'un fournisseur Managed Better Auth avec vérification OTP et origines `xartists.art` / `www.xartists.art`, mais **0 table métier sur 6 recherchées** lors du contrôle précédent. La base liée effectivement au runtime Render n'est donc toujours **pas identifiée/certifiée**. Ne pas appliquer les migrations SQL dans la sandbox par simple déduction.

## Validation et limitations

CI : tests de compte et du JWT, refus d'accès sans config, tests du schéma avec injection de panne et concurrence, test navigateur de la logique réseau OTP sans emails réels, TypeScript, build Vite, audit des routes et exécution intégrée sur un PostgreSQL 16 **jetable**.

L'implémentation OTP directe suit les endpoints Neon Managed Better Auth, mais le **vrai essai d'inscription OTP en navigateur Chrome + Safari**, l'accessibilité des cookies tiers, la délivrabilité email et la présence d'un JWT utilisable nécessitent une recette depuis le domaine officiel. Safari/ITP peut bloquer les cookies inter-domaines. À terme, évaluer le SDK officiel Neon ou une façade première partie sécurisée si cette restriction apparaît. Ne pas basculer vers un token en `localStorage` pour la contourner.

**Avant GO production :** attestation de la bonne base sans diffusion du DSN, sauvegarde + restauration d'un clone, migrations approuvées et rôle minimal, fournisseur SMTP dédié, vérification origin/JWKS, recette email/OTP/session réelle, révoquer sessions, suppression de compte/export, contrôle anti-abus, puis facturation et droits de données. Aucun paiement ou rapport payant n'est activé ici.

Références produit : https://neon.com/docs/auth/guides/plugins/email-otp et https://neon.com/docs/auth/guides/plugins/jwt.
