---
hidden: true
noIndex: true
---

# GO\_LIVE Status — 1 octobre 2026

## Décision actualisée — 4 novembre 2026

**NO-GO global.** Le titre conserve la date historique ; les constats du 1 octobre ne constituent plus une validation de lancement.

Contrôle du dépôt sur `de0ec71559a6bdea86bb09771b61c89060d1fdad` : [PR #378](https://github.com/Neltud/xArtists/pull/378) fusionnée, parcours BUY_PACK **PAPER uniquement**. La fusion ne prouve pas son déploiement.

Sondes publiques externes du 4 novembre, GET sans signature ni transaction, cache TTL demandé à zéro :

| Surface | Observation | Décision |
| --- | --- | --- |
| Build public | `0483ecd4f51b4ccdf1fc93db0dbd82095725a300`, construit le 2 novembre à 19:15:03 UTC | Version antérieure au main inspecté |
| Marketplace | Catalogue rendu, transactions explicitement désactivées | Consultation seulement |
| `/auction/`, `/offres/` | HTTP 404 | Bloquant publication |
| `/tro/sale/`, `/finance/tro/sale/` | Écran « Unable to preload CSS » pour TroCrosschainPage | Bloquant publication |
| API `/health` | HTTP 503 sur deux lectures, dont une URL avec paramètre distinct | Disponibilité non établie ; cause inconnue |
| API `/api/paybox/orders-store/status` | HTTP 503 sur cette sonde | Revalider la dépendance ; aucun diagnostic SQL établi |

Ces observations sont ponctuelles et doivent être renouvelées après correction. Elles ne constituent pas une inspection visuelle exhaustive ni un test mobile de tous les modules.

## Conditions de levée des blocages

1. **Publication** — résoudre [#362](https://github.com/Neltud/xArtists/issues/362) : source Pages GitHub Actions, publisher Vite unique, SHA public correspondant au run déployé, routes directes HTTP 200 et chargement réel JS/CSS. Les correctifs préparés #358 et #361 ne sont pas fusionnés dans le main inspecté.
2. **API** — rétablir et expliquer les 503 ; vérifier health, stockage orders et mint jobs dans la base réellement liée à Render, sans exposer de secret. Un HTTP 200 seul ne prouve pas la livraison.
3. **Données LIA** — source autorisée, timestamps producteur, TTL et état périmé explicites ; [#347](https://github.com/Neltud/xArtists/issues/347). Ne pas afficher LIVE sur une simulation ou un snapshot ancien.
4. **Paiement et NFT** — preuve paiement réel → IPN signé → mint confirmé → propriété NFT → My Packs, avec reprise, idempotence et remboursement ; [#281](https://github.com/Neltud/xArtists/issues/281). Revue du domaine anti-rejeu claim : [#328](https://github.com/Neltud/xArtists/issues/328).
5. **TRO / Solana** — attestation de la représentation 1:1, réserves, contrôle wallet et sécurité bridge : #298 et #353. Un mint local à supply zéro n'est pas une preuve mainnet.
6. **Design et parcours** — vérifier la version réellement publiée, mobile et desktop, CTA, traductions, droits et états vides. Les tests locaux d'une PR ne valident pas un site ancien publié.

## Politique d'ouverture

Une adresse et un codehash ne suffisent pas à autoriser un module financier. Exiger les contrôles applicables, les preuves de parcours et la décision de lancement propre au module. Une panne ou une preuve absente conserve les actions financières fermées.

Le parcours LIA P0 reste PAPER ; aucun paiement, mint ou droit n'est créé par sa confirmation. Les activations checkout, mint live, trading, bridge et enchères ne sont pas autorisées par ce document. Les valeurs runtime actuelles n'ont pas pu être relues à cause du 503.

## Historique

Le constat du 1 octobre mentionnait dix codehash non nuls et des transactions de validation encore à faire. Il ne prouvait ni les contrôles actuels, ni une livraison complète, ni un feu vert commercial. Les adresses historiques restent dans `data/contracts.json` et doivent être revérifiées avant usage.
