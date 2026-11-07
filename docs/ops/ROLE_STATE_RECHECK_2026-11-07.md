# xArtists — relecture publique des rôles au 7 novembre 2026

**Observation :** lecture seule des trois collections sur Explorer/API publique; aucun wallet connecté, aucune transaction, aucune clé ni signature. [Journal de navigation](https://agent.tinyfish.ai/runs/5b970243-c84f-4cf7-8a14-e9a6de025840).

| Collection | Propriétaire | `canAddSpecialRoles` | `ESDTRoleSetNewURI` propriétaire | `ESDTRoleNFTUpdate` propriétaire |
|---|---|---|---|---|
| [Pulse XAIPLS-2cf72b](https://explorer.multiversx.com/collections/XAIPLS-2cf72b/roles) | `erd1kex0…v8v0g` | Oui | **Absent** | **Absent** |
| [Yield XAIYLD-987e24](https://explorer.multiversx.com/collections/XAIYLD-987e24/roles) | `erd1kex0…v8v0g` | Oui | **Absent** | **Absent** |
| [Sentinel XAISNT-3d8a6b](https://explorer.multiversx.com/collections/XAISNT-3d8a6b/roles) | `erd1kex0…v8v0g` | Oui | **Absent** | **Absent** |

Les vues publiques montrent uniquement `ESDTRoleNFTCreate` affecté au contrat créateur et `ESDTRoleBurnForAll` (Anyone). Pulse compte toujours quatre nonces; `XAIPLS-2cf72b-05` n'a pas été trouvé.

**Attention :** l'absence de champ URI dans une interface Explorer ne prouve pas à elle seule que l'URI on-chain est vide. Le relevé API du 6 novembre reste la dernière preuve structurée citée de `uris:[""]`; revérifier le JSON de chaque nonce avant toute mutation.

## Décision correcte : les signatures sont toujours nécessaires

Un compte-rendu automatisé de navigation a formulé à tort une phrase disant que « les signatures ne restent PAS requises » parce que les rôles sont absents. **C'est l'inverse :**

- Les rôles absents interdisent l'opération directe de réécriture / mise à jour.
- `canAddSpecialRoles: true` signifie que le **propriétaire peut attribuer** ces deux rôles, en signant `setSpecialRole`.
- Ce sont **trois transactions à autoriser**, une par collection, toutes vers le même wallet propriétaire. Les manifests restent `REVIEW_ONLY_NOT_SIGNED_NOT_BROADCAST`.
- L'attribution des rôles ne répare aucune URI à elle seule. Médias de packs approuvés + vrais CID + preuves d'hébergement indépendant et SHA doivent précéder toute autre signature.

**NO-GO maintenu pour mint additionnel, réparations, mise en vente / enchères et EGLD sur les six packs.** Ne pas déclarer `GO` simplement parce que les manifests ont passé les tests de cohérence.

## Pièces techniques disponibles dans la PR #426
- `PACK_ROLE_GRANT_UNSIGNED_2026-11-06.json` : trois payloads de revue non signés.
- `apps/frontend/scripts/verify-pack-role-manifest.mjs` : validation stricte contre falsifications, aucune fonction de signature.
- `PACK_MEDIA_EVIDENCE_REGISTER_2026-11-07.json` : état sans CID vérifié pour les six packs.
- `apps/frontend/scripts/verify-pack-media-readback.mjs` : double lecture SHA/MIME, sans prétendre à deux pins distincts.

Pour les rôles et transactions, consulter la [documentation MultiversX NFT](https://docs.multiversx.com/tokens/nft-tokens/) et relire les permissions actuelles juste avant toute signature.
