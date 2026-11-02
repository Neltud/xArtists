# Creator Studio — première collection et premier NFT (MultiversX mainnet)

**Priorité P0 · 2 novembre 2026.** Cette procédure couvre un artiste qui émet sa propre collection NFT et minte lui-même sa première œuvre. Elle ne concerne **pas** le mint des packs Genesis déclenché par PayBox, ni LIA Ops.

## Prérequis

- Wallet artiste personnel xPortal ou Web Wallet capable de signer sur **mainnet**, avec suffisamment d'EGLD.
- Une œuvre originale et les droits appropriés ; média réellement publié sur IPFS ou une URL HTTPS stable. Sélectionner un fichier local n'effectue **pas** de pinning IPFS.
- Pas de phrase secrète, PEM ou clé privée à partager.

## Parcours réel

1. Ouvrir https://neltud.github.io/xArtists/studio et connecter **son propre wallet**.
2. Choisir un nom (3–20 caractères) et ticker A-Z/0-9 (3–10 caractères). La transaction officielle **issueNonFungible** est adressée au contrat système MultiversX et coûte **0,05 EGLD + gaz**. Lire le récapitulatif wallet puis signer.
3. Attendre la confirmation sur Explorer, récupérer le **véritable identifiant** (ex. ART-abcdef), ne pas le déduire du ticker.
4. Saisir l'identifiant dans Studio. Le Studio interroge https://api.multiversx.com/collections/{identifier} pour vérifier l'owner et la présence du rôle **ESDTRoleNFTCreate**. Le rôle peut déjà être présent après l'émission ; s'il manque, **seul l'owner** peut signer setSpecialRole.
5. Coller une URL média IPFS ou HTTPS réellement publiée. Entrer un titre et les royalties souhaitées (Studio 0–10 %).
6. Signer **ESDTNFTCreate** (quantité 1), adressée **au wallet artiste lui-même**.
7. Ne considérer le NFT comme créé qu'une fois la transaction réussie sur Explorer ; vérifier la propriété, l'image, les royalties, le nonce et la collection. Une session ou un hash diffusé n'est PAS une preuve de succès.

## Contrôles et risques corrigés

- **Correctif essentiel :** setSpecialRole reçoit les **32 octets de la clé publique** de l'artiste encodés en hex. L'ancien code transmettait les octets UTF-8 du texte bech32, qui ne constituent pas une adresse protocolaire valide.
- API NFT, owner ou rôle inconnu → **fail-closed**.
- URI absente, titre ou quantité invalide → refus avant signature. Aucun fallback image factice.
- Brouillons séparés par adresse wallet ; posséder un NFT d'une collection ne permet **pas** d'en créer un nouveau.
- Métadonnées privées, détention artistique ou authenticité de l'œuvre ne sont pas garanties automatiquement par le protocole.
- Web Wallet peut retourner un identifiant de session sans hash : la vérification Explorer doit alors être effectuée manuellement.

## Release gate

Le code frontend, ses tests et la préproduction doivent passer. **Un véritable premier mint d'artiste volontaire, confirmé par TxHash et NFT reçu**, reste nécessaire avant de communiquer « parcours de mint mainnet testé de bout en bout ». Aucun agent ne signe ni n'envoie des fonds pour l'artiste.

Il faut aussi distinguer ce flux direct du **minter commercial PayBox/Genesis**, qui reste NO-GO tant que le vrai paiement, la livraison et les remboursements ne sont pas prouvés.

Source officielle : https://docs.multiversx.com/tokens/nft-tokens/

Tests : depuis apps/frontend, npm ci --legacy-peer-deps ; npm run typecheck ; npm run test:release ; npm run build.
