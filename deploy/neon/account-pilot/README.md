# Neon Free — pilote utilisateur authentifié (sans wallet)

Ce lot utilise **Neon Managed Better Auth** déjà actif sur `xartists-access-sandbox` et ne modifie pas le frontend public ni l'ancienne API. L'application publique reste sur GitHub Pages, le mail chez OVH MX Plan. Le projet Neon Free conserve ses quotas.

## Preuve d'identité et droits
- Vérificateur **EdDSA/Ed25519** extrait du backend Access API déjà audité (`services/access-api/src/neonAuthIdentity.mjs`). JWKS récupéré **uniquement** auprès de l'instance Neon Auth opérateur, jamais d'un jeton client. Vérifie algorithme, signature, `iss`, `aud`, `exp`, `iat`, `sub`, e-mail vérifié et absence de bannissement. Pas de service privé ni de secret client dans `VITE_*`.
- `GET /v1/account/me` exige `Authorization: Bearer <JWT Neon>`. Retourne **uniquement un identifiant pseudonymisé** dérivé du sujet signé, `type=email_verified` et aucune autorisation de wallet, commerce, abonnement ou mint. **Ce n'est pas encore la projection `xa_user_accounts` persistante**. Le client doit obtenir le JWT via Neon Auth après connexion et vérification e-mail.
- `GET /v1/studio/drafts/config` annonce le bucket privé `xartists-studio-drafts` du sandbox mais `upload_enabled=false` : aucun presign ou upload non authentifié. Le bucket est effectivement créé, sans média client pour le moment.
- `GET /health` retourne `service=xartists-neon-authenticated-pilot`, `environment=sandbox` et `production_access_api=false`. Ne pas confondre avec `access-api` ou brancher `VITE_ACCESS_API_BASE` sur ce service.
- `POST/PUT/PATCH/DELETE` systématiquement HTTP 405 ; origines autorisées strictement `https://xartists.art` et `https://www.xartists.art`. Tous les échecs d'identité HTTP 401 / configuration 503.

## Activation sur le sandbox existant
1. Après tests CI, packager `index.mjs` et `neon-verifier.mjs` à la racine d'un ZIP, sans npm et sans fichier secret.
2. Déployer via connecteur Neon le slug **`xartistsauthpilot`** sur `project=orange-dust-23862418`, `branch=br-steep-sun-bab7l93p`, `runtime=nodejs24`. Variables **publiques, non sensibles** `NEON_AUTH_BASE_URL` (base exacte récupérée par le connecteur) et `XARTISTS_SOURCE_SHA` (SHA exact fusionné).
3. Valider depuis un client externe `GET /health` (200), `GET /v1/account/me` sans jeton (401), origine inconnue (403), POST (405), et `GET /v1/studio/drafts/config` (upload OFF). Le succès du refus anonyme ne prouve **pas** qu'un utilisateur a réussi l'OTP ; un test de connexion sur un compte de recette consentant reste indispensable.
4. Lorsque la vraie connexion, les profils, les migrations, l'isolation de stockage et les droits utilisateurs seront démontrés, développer un service de **brouillons privés** avec presigned URL courte, limites par utilisateur, vérification du MIME et empreinte, puis relire le fichier stocké hors du navigateur. Ne jamais créer une signature NFT automatiquement.

**NO-GO actuel** : pas de mise en production des comptes, pas d'upload réel, pas de DB mappée et pas de changement DNS. Une identité e-mail prouvée ne constitue pas une preuve de possession wallet.
