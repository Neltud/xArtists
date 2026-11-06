# XA World Rights v0.4 — développement OAuth YouTube, non connecté

## Renommage

XA World Rights est le nouveau nom public du plugin existant. Son identifiant backend, son identifiant technique de package `xartists-social-rights`, les chemins des compétences et ses archives sont conservés pour préserver les références et les versions. Ce renommage n'implique aucune extension territoriale des droits ni droit universel automatique. Un contrat conserve ses limites explicites, les droits du créateur et sa rémunération définie.

## Ce qui est développé

`scripts/youtube_oauth_core.py` implémente un noyau serveur pour orchestrer :

1. Une demande d'autorisation Google limitée à `youtube.readonly`, en accès online, sans agrégation automatique de permissions antérieures.
2. Un `state` aléatoire à durée de cinq minutes, stocké sous empreinte, lié à la session serveur authentifiée et consommé atomiquement avant l'échange de code. Une réponse ambiguë exige une nouvelle autorisation ; aucune relance automatique du code.
3. Un callback HTTPS exact configuré, rejet des paramètres dupliqués, des erreurs d'autorisation, d'un issuer inattendu et des jetons de portée absente ou plus large que la lecture seule.
4. Une lecture du compte autorisé avec `channels.list(mine=true)` puis une liaison vidéo/chaîne via `videos.list`. Une pagination incomplète bloque la conclusion.
5. Des jetons d'accès uniquement en mémoire, cachés dans les représentations des objets, liés à une session, avec expiration et déconnexion locale. Aucun refresh token conservé. La déconnexion locale ne révoque ni le consentement chez Google ni un post ni une licence ; une lecture déjà en cours peut terminer.

Deux adaptateurs serveur de confiance sont requis : `exchange(request)` et `read(access_token, endpoint, params)`. Aucun client HTTP, service web, interface de connexion ou secret client n'est fourni. Les fixtures des tests ne sont pas des preuves Google. L'API d'injection est un point d'intégration interne, jamais une fonction exposée au navigateur ou à un modèle. Ne pas la brancher à un transport réel sans configuration et autorisation séparées. Tous les résultats conservent `copyrightVerified=false`, `listingApproved=false`, `liveReady=false`.

## Ce qui manque avant un essai réel

- Projet Google et client confidentiel autorisés, YouTube Data API activée, callback exact enregistré, consent screen/scopes/quotas et éventuelle vérification Google revus pour le compte cible.
- Hébergement d'un backend authentifié, cookies Secure/HttpOnly/SameSite, protection CSRF au démarrage de connexion et endpoints d'intégration contrôlés ; le paramètre de session du noyau provient exclusivement de ce backend.
- Adaptateurs utilisant une bibliothèque officielle et des destinations Google fixes, TLS vérifié, timeouts, absence de redirection et journaux expurgés. Le secret client reste dans le serveur. Vérifier le flux/client retenu et le support PKCE avant un test réel : cette version n'implémente ni PKCE ni OIDC et ne doit pas être présentée comme telle.
- Stockage/quotas opérationnels et mécanisme de révocation fournisseur. Le noyau mémoire est mono-processus, perd les autorisations au redémarrage et n'est pas un coffre-fort : aucune persistance chiffrée ni purge garantie de la mémoire Python. Les champs internes ne constituent pas une frontière contre un opérateur du processus.
- Tests d'intégration sur compte explicitement autorisé, refus de consentement, compte/chaîne non attendu, expiration, scopes insuffisants, quota, perte de connexion et absence d'action d'écriture.

## Sources officielles consultées le 2026-11-06

- https://developers.google.com/identity/protocols/oauth2/web-server — état CSRF, code d'autorisation, callback et application serveur confidentielle.
- https://developers.google.com/youtube/data/guides/authentication — scope YouTube lecture seule et autorisation des lectures privées.
- https://developers.google.com/identity/protocols/oauth2/native-app — support PKCE pour le flux installé, qui ne doit pas être confondu avec un client web confidentiel.

## Limites maintenues

Version privée de prototype, pas un déploiement de Neltud/xArtists et pas un produit LIVE. Le schéma des reçus v1.0.0 n'est pas modifié. Les candidats reçus restent `unverified`. Le noyau OAuth ne peut ni modifier le registre des consentements ni transformer une preuve de contrôle de compte en droits d'auteur, règlement ou livraison. Aucun paiement, publication/révocation de post, livraison, mint ou permission commerciale n'est ajouté. Les fonctionnalités financières restent dans une version ultérieure séparée de la première activation OAuth.

## Vérification reproductible

Depuis le répertoire `skills/social-rights` : `python -m unittest discover -s scripts -p 'test_*.py' -v`. Les tests OAuth utilisent seulement des réponses injectées locales. La suite vérifie aussi les réservations concurrentes du registre et le refus permanent de l'activation commerciale.
