# xArtists — Authentification Neon JWT / comptes sans wallet — PREP (10 novembre 2026)

**NO-GO production.** Le présent lot livre une primitive **interne** qui vérifie cryptographiquement l'identité d'un utilisateur Neon Auth avant toute projection ou création d'un compte PostgreSQL xArtists. Il n'expose **aucun** endpoint public d'inscription, de login, de paiement, de liaison wallet, de souscription, d'admin ou de mint.

## Contrat d'authentification et limites

- Document fournisseur : [Neon Managed Better Auth JWT](https://neon.com/docs/auth/guides/plugins/jwt), mis à jour le 5 novembre 2026. JWT courts (15 min), Ed25519 / `EdDSA`, `iss` et `aud` strictement égaux à l'**origine** de l'instance Neon Auth ; clés publiques du `/.well-known/jwks.json` lié à la **base URL sélectionnée par l'opérateur**.
- Module : `services/access-api/src/neonAuthIdentity.mjs`. `createNeonAuthIdentityVerifier({baseUrl})` renvoie un vérificateur asynchrone ; une URL HTTP, hors `*.neon.tech`, malformée ou issue d'un champ du navigateur est refusée. La route JWKS est dérivée de l'URL configurée, jamais d'un champ `jku` / `x5u` du jeton.
- Rejets : signature non valide, algorithme autre qu'EdDSA, `kid` absent ou ambigu, issuer/audience incorrects, jeton expiré ou émis dans le futur, `nbf` futur, durée anormale, e-mail non confirmé, identité bannie, `sub`/id discordants, JWKS inaccessible ou mauvais format.
- Refus d'un jeton signé ne constitue **pas** une validation de session révoquée : les jetons peuvent rester utilisables jusqu'à expiration. Pour une action sensible, exiger validation/actualisation de session et règles d'entitlement serveur supplémentaires.
- Le sujet d'identité interne est lié à la source JWKS **exacte**, pour ne pas confondre deux instances Neon Auth ayant des `sub` identiques.
- `findOrCreateAccountFromNeonToken(pool, token, verifier)` applique la preuve d'abord, puis réutilise `findOrCreateAccountForVerifiedIdentity`. Il n'associe pas de wallet, n'autorise pas de paiement, n'octroie aucun rôle NFT ni d'abonnement. Cette fonction exige un vrai pool PostgreSQL ; aucune migration n'est appliquée par cette PR.
- L'accès aux services nécessite une **chaîne distincte** : événement PSP réellement signé → écriture durable → abonnement actif non expiré → projection d'accès serveur, puis annulation et remboursement. Un simple JWT ne prouve **aucun** paiement.
- Wallet MultiversX : challenge SIWX et preuve de signature **séparés** sur l'adresse, chainId, origine et nonce ; un compte sans wallet peut rester sans wallet.

## Réglages Neon Auth sandbox à corriger lors d'une recette dédiée

La lecture de configuration de `xartists-access-sandbox` du 10/11 a montré `require_email_verification=false`, `verify_email_on_sign_up=false`, `verify_email_on_sign_in=false`, `trusted_origins=[]` et des webhooks désactivés. **Aucune configuration n'a été modifiée.** L'existence de tables Neon Auth dans la sandbox ne démontre ni authentification xArtists production ni identité de la base Render.

## Exécution de recette

```sh
node --test services/access-api/tests/neonAuthIdentity.test.mjs
node --test services/access-api/tests/accountTypes.test.mjs services/access-api/tests/accountRepository.test.mjs services/access-api/tests/neonAuthIdentity.test.mjs services/access-api/tests/subscriptionAccess.test.mjs
```

L'action GitHub `Account identity and fiat subscription policy` doit inclure ces tests et être **verte au HEAD exact**. Les tests utilisent uniquement des clés Ed25519 **éphémères** créées dans Node, des JWT synthétiques, un faux fournisseur JWKS et une simulation de pool : pas de secrets, de client réel, de base externe ni de transaction.

## Conditions avant un endpoint d'authentification utilisable

1. Choisir l'instance Neon Auth de **production** et en confirmer les origines de confiance ; valider le comportement cookies (Safari/mobile inclus), CSRF, logout, création et récupération du compte, email OTP et anti-abus.
2. Corriger la vérification e-mail en sandbox, puis tester la procédure de promotion et un compte test confirmé sans exposer de données personnelles.
3. Démontrer le lien du service Render avec la base PostgreSQL choisie, sa résilience, ses migrations, son TLS, la restauration et l'idempotence multi-réplicas. Ne jamais copier de DATABASE_URL dans GitHub.
4. Vérifier que les versions de la bibliothèque JWT et les éventuelles rotations JWKS/retraits de clé n'autorisent pas de réutilisation dangereuse ; réévaluer les TTL et le cache.
5. Intégrer une route privée d'authentification avec protections anti-rejeu, CORS strict, quotas, sessions, validations de l'utilisateur, tests d'intégration réels. Ne pas traiter cette primitive comme un service d'inscription à elle seule.
6. Auditer et signer une décision de déploiement séparée. Les paiements EUR, achats EGLD et NFT restent tous **NO-GO**.

Références : [issue comptes #465](https://github.com/Neltud/xArtists/issues/465), [launch gates](../security/launch-gates.md), [projection abonnements #479](https://github.com/Neltud/xArtists/pull/479).
