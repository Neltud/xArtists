# Revue des trois attributions de rôles — non signées

**Date :** 6 novembre 2026. **Réseau :** MultiversX mainnet, chainId `1`. **Mode :** revue uniquement. Ce document n'est pas une transaction signée et ne doit pas être diffusé tel quel.

Contrôle juste avant rédaction : meta-chain nonce `39512645`, round `40376113`. Les trois collections ont encore `canAddSpecialRoles: true` et n'ont toujours pas `ESDTRoleSetNewURI` ni `ESDTRoleNFTUpdate`.

Payloads : [PACK_ROLE_GRANT_UNSIGNED_2026-11-06.json](./PACK_ROLE_GRANT_UNSIGNED_2026-11-06.json).

## Ce que chaque transaction fait

Une transaction par collection. Deux rôles dans chacune. Le signataire et le bénéficiaire des rôles sont le même wallet : `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`.

| Champ | Valeur attendue dans le wallet |
| --- | --- |
| Receveur | `erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u` |
| Valeur | 0 EGLD |
| Fonction | `setSpecialRole` |
| Gaz | 60 000 000, ne pas réduire |
| Plafond de frais | 0,06 EGLD par transaction si tout le gaz est consommé au prix minimum 1 Gwei |
| Nonce | celui proposé par le wallet au moment de signer, jamais un nonce copié |

Ordre conseillé : Pulse `XAIPLS-2cf72b`, puis Yield `XAIYLD-987e24`, puis Sentinel `XAISNT-3d8a6b`. Attendre le statut `success` de chacune avant de signer la suivante, pour ne pas réutiliser un nonce.

Arguments décodés, identiques pour les trois sauf le ticker :

1. Identifiant de la collection.
2. Clé publique du wallet propriétaire, 32 octets : `b64cf0b0256cd0797b5044332b10c7d4ee6e02caaec9a74efd3b51d2ec9b65cc`. Contrôlé avec `@multiversx/sdk-core` 13.17.2, la même règle que `walletAddressToHex`. Ce n'est pas l'hexadécimal du texte `erd1…`.
3. `ESDTRoleSetNewURI` — réécriture future des URI via `ESDTSetNewURIs`.
4. `ESDTRoleNFTUpdate` — mise à jour future des métadonnées.

Ces transactions n'ajoutent pas d'URI, ne mintent rien, ne transfèrent aucun NFT et n'ouvrent aucune vente.

## Refuser la signature si

- le receveur n'est pas le contrat système ESDT ci-dessus ;
- la valeur n'est pas zéro ;
- un rôle autre que les deux cités apparaît, en particulier `ESDTTransferRole`, burn, `ESDTRoleModifyCreator`, `ESDTRoleModifyRoyalties` ou `ESDTRoleNFTAddURI` ;
- le bénéficiaire n'est pas le wallet propriétaire, notamment s'il s'agit du contrat marketplace `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` ;
- le libellé `ESDTRoleNFTSetNewURIs` est utilisé : ce n'est pas la constante du nœud ;
- le bouton Studio « Signer setSpecialRole » est proposé : ce chemin ne donne que `ESDTRoleNFTCreate`.

## Après un succès

Enregistrer le hash et le bloc. Relire `https://api.multiversx.com/collections/{id}`. Les deux rôles doivent apparaître sur le wallet propriétaire. Tant que ce n'est pas le cas, ne pas enchaîner avec `ESDTSetNewURIs`.

Même après les trois succès : pas de CID, pas de réparation des six NFT, pas d'annonce EGLD. Les œuvres Drive ne deviennent pas le média des packs.
