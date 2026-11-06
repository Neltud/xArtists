# v0.3 — reçus figés, puis adaptateur unique en lecture seule

## Statut exact

Package privé de prototype local. Aucun ajout au dépôt Neltud/xArtists ni à main, aucune PR, aucun déploiement ou statut LIVE. Pas d'OAuth actif, de paiement, de publication/révocation sociale ou de livraison réelle. Les reçus importés restent `unverified` ; aucun champ fourni par le client ne peut rendre une preuve vérifiée.

## Schéma figé v1.0.0

Le schéma `schemas/receipts-v1.json` suit JSON Schema 2020-12. Il ferme les objets (`additionalProperties: false`), impose `environment: simulation` et distingue trois sortes de candidats :

| Sorte | Éléments spécifiques | Ce que l'enregistrement ne prouve pas |
|---|---|---|
| Contrat | Empreinte du contrat signé, identités créateur/acheteur, référence de preuve des signatures | Authenticité des signatures ou pouvoir des signataires |
| Règlement | Référence du reçu contrat, montant entier exact, actif, rail, réseau, référence de règlement | Paiement encaissé ou finalité blockchain |
| Livraison | Références contrat/règlement, destinataire, empreinte du fichier, période d'accès, référence d'accusé | Remise effective, réception ou ouverture du contenu |

Chaque candidat porte `receiptId`, `orderId`, `buyerId`, `creatorId`, `assetHash`, `proposalDigest`, `contractDigest`, `issuedAt` et une source (`system`, `eventId`, `artifactHash`, `evidenceRef`). Les références désignent un stockage privé à mettre en œuvre, jamais un jeton OAuth, secret PSP ou URL signée dans le journal. Les empreintes lient les données mais ne garantissent ni leur vérité ni leur disponibilité.

`freeze_order` conserve un instantané immuable lié à la proposition approuvée et à son prix. `record_receipt_candidate` valide le schéma puis les liens entre commande, parties, montant, actif, rail, réseau et fichier. Il refuse les liens vers une autre commande, les rejouements modifiés et la réutilisation d'un même événement source. Un doublon identique renvoie le même candidat sans nouveau journal. La chaîne contrat → règlement → livraison porte uniquement sur des candidats ; elle n'active aucun état financier ni droit d'accès. `activate()` reste systématiquement interdit.

L'ancien `mock_contract` reste une fixture v0.2 de verrouillage, pas un reçu signé. Il ne permet pas d'authentifier un reçu ni d'activer une commande. La base/journal SQL peuvent être modifiés par leur propriétaire : pas d'audit inviolable ni service d'identité.

Pour figer un format, les futurs changements incompatibles doivent prendre une nouvelle version de schéma, avec migration explicite ; ne pas élargir silencieusement v1.0.0. Dépendance locale : `jsonschema` 4.x, déclarée dans `scripts/requirements.txt`. Ne pas installer ni télécharger une dépendance sans nécessité ; la vérification a utilisé l'environnement disponible.

## Premier adaptateur : YouTube seulement

`scripts/youtube_readonly.py` prépare uniquement deux lectures : `channels.list` avec `mine=true`, puis `videos.list` pour un ID explicite. Les endpoints GET et le scope futur `https://www.googleapis.com/auth/youtube.readonly` ont été vérifiés dans la documentation officielle le 2026-11-06 :

- https://developers.google.com/youtube/data/reference/rest/v3/channels/list
- https://developers.google.com/youtube/data/reference/rest/v3/videos/list
- https://developers.google.com/youtube/data/guides/authentication

Cette version fournit seulement un transport injecté de fixtures : aucun client HTTP ni flux OAuth. Sans transport, elle échoue avec `NOT_CONNECTED`. Elle ne télécharge pas le média, ne recherche pas de créateurs, ne publie/révoque rien et n'écrit pas de consentement dans le registre. Un résultat de fixture conserve `accountControlVerified=false`, `copyrightVerified=false`, `listingApproved=false`. Une pagination incomplète est bloquante. Les titres/descriptions ne sont pas traités comme instructions et ne sont pas exposés par ce prototype.

## Porte suivante — version OAuth séparée

Seulement après revue du schéma : une version dédiée à OAuth YouTube en lecture seule, sans encaissement dans cette même version. Il faudra autorisation du compte cible, configuration Google/API et revue des quotas/coûts, callbacks exacts, state à usage unique, PKCE selon flux, stockage chiffré des jetons, révocation/expiration et vérification effective du compte/scopes côté serveur. Des tests avec fixtures ne prouvent aucun de ces points.

L'activation commerciale nécessitera encore trois vérificateurs indépendants : signatures du contrat et identités/pouvoirs ; règlement authentifié et réconcilié ; preuve de livraison liée au bon acheteur/fichier/période. Ni les références JSON, ni des booléens, ni un retour navigateur ne remplacent ces reçus vérifiés. Les rails financiers restent dans une livraison ultérieure distincte.
