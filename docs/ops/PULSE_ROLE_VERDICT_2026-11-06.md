# Verdict live — rôles Pulse / Yield / Sentinel et blocage IPFS

**Date :** 6 novembre 2026, après 20:37 CET. **Mode :** lecture seule. **Aucune transaction diffusée.** Grok administre le processus ; seul le wallet propriétaire peut signer `setSpecialRole` ou `ESDTSetNewURIs`.

Sources : `GET https://api.multiversx.com/collections/{id}`, `GET /nfts/{identifier}`, VM query `getSpecialRoles` sur le contrat système ESDT au bloc **39511436** (`cb726959a876ae6251fb105dcec52554ea49d34aefaeaa512fc8b13cba5d3c15`). Constante de protocole : [`ESDTRoleSetNewURI`](https://github.com/multiversx/mx-chain-core-go/blob/v1.4.1/core/constants.go) (rôle) et fonction `ESDTSetNewURIs`. La page docs « Set new URIs » écrit parfois `ESDTRoleNFTSetNewURIs` : **ne pas utiliser cette chaîne**, elle ne correspond pas à la constante du nœud.

## Rôles : réparation impossible en l'état, encore ouvrable

Les trois collections ont le même propriétaire `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`, `canAddSpecialRoles: true`, `canUpgrade: true`, `canChangeOwner: false`, `canPause: false`, `canFreeze: false`.

| Collection | Rôles décodés | canAddUri | canUpdateAttributes |
| --- | --- | --- | --- |
| `XAIPLS-2cf72b` | `ESDTRoleNFTCreate` sur le SC ; `ESDTRoleBurnForAll` avec adresse vide dans le retour VM | false | false |
| `XAIYLD-987e24` | identique | false | false |
| `XAISNT-3d8a6b` | identique | false | false |

Retour VM Pulse, décodé : `:ESDTRoleBurnForAll` et `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg:ESDTRoleNFTCreate`. Aucune adresse ne porte `ESDTRoleNFTAddURI`, `ESDTRoleNFTUpdate`, `ESDTRoleNFTUpdateAttributes` ni `ESDTRoleSetNewURI`.

Le contrat `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` a toujours le `codeHash` documenté `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`, owner = wallet de déploiement, upgradeable, non payable. Il ne sait pas, d'après son mandat publié, écrire des URI. **Ne pas lui donner le rôle de réparation** tant qu'aucun endpoint audite ne l'appelle : le rôle y serait inutilisable.

`ESDTRoleNFTCreate` ne répare pas un NFT déjà minté. `ESDTRoleNFTAddURI` ne convient pas non plus comme outil principal : `uris` vaut déjà `[""]`. AddURI **ajoute** ; il ne remplace pas la première URI vide, celle que les wallets lisent.

### Transaction à préparer, pas à envoyer

Signature exigée : **uniquement** `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`.

- Receveur : contrat système ESDT `erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u`
- Fonction : `setSpecialRole`
- Pour chaque collection, accorder au **même wallet propriétaire** : `ESDTRoleSetNewURI` et `ESDTRoleNFTUpdate`
- Ne pas accorder `ESDTTransferRole` (cela restreindrait les transferts), ni burn, ni `ESDTRoleModifyCreator`, ni `ESDTRoleModifyRoyalties` (royalties déjà à 5 %)

Après preuve du rôle sur l'API, la réparation est `ESDTSetNewURIs` (réécriture) signée par ce wallet, une fois les CID prouvés. Pas avant.

## NFT réellement détenus — ce ne sont pas les œuvres Drive

Tous ont `uris: [""]`, image indexer `https://media.multiversx.com/nfts/thumbnail/default.png`, royalties 5 %, créateur = le SC marketplace. Attributs Pulse décodés : `series:Pulse;tier:Gold;product:access`. `XAIPLS-2cf72b-05` : HTTP 404.

| NFT | Nom on-chain | Détenteur | Apte à signer une vente ? | Média vendable ? |
| --- | --- | --- | --- | --- |
| `XAIPLS-2cf72b-01` | Agent Pack Pulse | `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` | oui, ce détenteur | non |
| `XAIPLS-2cf72b-02` | Agent Pack Pulse | même admin | oui | non |
| `XAIPLS-2cf72b-03` | Agent Pack Pulse | `erd1kex0…v8v0g` | oui, ce détenteur | non |
| `XAIPLS-2cf72b-04` | Agent Pack Pulse | wallet de déploiement | oui | non |
| `XAIYLD-987e24-01` | Agent Pack Yield | admin `erd1mmh2…` | oui | non |
| `XAISNT-3d8a6b-01` | Agent Pack Sentinel | admin `erd1mmh2…` | oui | non |

Donc **un NFT de chaque collection pack est détenu par le wallet admin**, pas par le wallet de déploiement. Le wallet de déploiement ne peut pas lister Yield ni Sentinel : il ne les détient pas. Le propriétaire de collection n'est pas le détenteur de tous les nonces.

Les cinq PNG Drive de la PR #426 restent des assets de galerie. Les coller automatiquement sur ces packs mélangerait une œuvre de vitrine et un jeton `product:access`. La réparation n'utilise que le média que le propriétaire désigne pour chaque nonce, avec CID, SHA-256 et deux lectures gateway identiques.

## IPFS et domaine

- Aucun CID on-chain.
- DNS public (1.1.1.1 et 8.8.8.8), rcode **NXDOMAIN** : `xartists.art`, `www.xartists.art`, `api.xartists.art`.
- Le site qui répond est GitHub Pages : `https://neltud.github.io/xArtists/` HTTP 200. Ce n'est pas une preuve d'hébergement IPFS.
- L'endpoint documenté `/v1/studio/media/config` n'a pas de nom DNS. Pas d'upload, pas de pin, pas de sauvegarde à contrôler dans ce passage.

## Décision

**NO-GO** pour toute réparation d'URI, tout mint supplémentaire, toute annonce EGLD et toute mise en vente XOXNO de ces six NFT.

Ordre restant, chacun bloquant le suivant :

1. Le propriétaire signe `setSpecialRole` (`ESDTRoleSetNewURI` + `ESDTRoleNFTUpdate`) sur les trois collections, vers son propre wallet. Vérifier le retour API avant toute autre signature.
2. Choisir le média de pack (pas un PNG de galerie par défaut), le pin sur deux infrastructures, prouver HTTP 200, MIME et SHA-256.
3. `ESDTSetNewURIs` par nonce existant seulement. Pas de nonce 5.
4. Seulement ensuite, le **détenteur** du nonce peut ouvrir une annonce. Le pack d'accès ne transfère pas à lui seul les droits d'une œuvre Drive.
