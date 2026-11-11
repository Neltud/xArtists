# xOrus • Parcours utilisateur — NFT & sculpture

**État au 11 novembre 2026 : PR #514 fusionnée et GitHub Pages publie le SHA `969b3a96c38aba5a1ab596535490f097079e3c8e` ([preuve](https://github.com/Neltud/xArtists/actions/runs/43093538589)). Aucun nouveau listing ni mint utilisateur n'est réputé confirmé sans transaction sur Explorer.**

## Je veux vendre un NFT de mon wallet

1. Ouvrir `/marketplace` puis **Vendre mon NFT** (ou `/marketplace#xa-market-sell`) et connecter un wallet **signataire**. La visite et la galerie fonctionnent sans wallet.
2. Choisir son NFT déjà détenu. Le bouton de vente n'est proposé qu'après lecture du portefeuille et d'une collection prise en charge ; les packs Genesis et les données sans preuve restent non listables.
3. Indiquer un prix en **EGLD**. Lire les frais du contrat, les royalties du **créateur on-chain**, l'adresse qui perçoit ces royalties et le montant vendeur théorique.
4. Confirmer une seconde fois. Le wallet montre alors la transaction **ESDTNFTTransfer → listNft**. Elle dépose le NFT dans l'escrow contractuel, **elle ne prouve pas qu'il a été vendu**.
5. Après signature, rechercher sur **MultiversX Explorer** le statut `success`, l'identifiant du listing créé et le NFT en escrow. Un simple ID SDK ou une fenêtre xPortal ne vaut pas une preuve.
6. L'achat d'un listing par un autre utilisateur reste contrôlé séparément : état actif du listing, prix atomique, codeHash et escrow avant chaque signature. La branche ne débloque pas automatiquement les enchères, le checkout fiat ni les packs agents.

**Si la vente est indisponible :** vérifier session de signature xPortal, présence et propriétaire du NFT, média, hash payable du contrat, droits de son créateur et frais compatibles. Un RPC indisponible bloque la signature. On ne colle jamais de seed ou de PEM.

## Je veux créer le NFT de ma sculpture

1. Ouvrir `/lab?view=3d`, charger **4 à 36 photos** ou un court **MP4** pour la rotation photographique locale. On peut aussi ouvrir un **vrai GLB glTF 2.0 jusqu'à 32 Mio** déjà produit ; c'est un aperçu local non certifiant.
2. Pour produire un véritable maillage 3D métrique, passer par `/create/digital-twin` : photogrammétrie COLMAP/Meshroom hors navigateur, échelle physique et certificat vérifiable. Une animation de photos n'est **pas** une reconstruction.
3. Cliquer **Créer le NFT de ma sculpture** : `/studio?mode=sculpture`. Choisir/émettre la collection NFT et vérifier le rôle `ESDTRoleNFTCreate` sur MultiversX.
4. Préparer un titre, le fichier **photo/MP4** ou **GLB avec image de couverture**, confirmer les droits d'auteur et publier les métadonnées sur **IPFS** via le service authentifié s'il est disponible. Un simple fichier local ne peut pas être minté.
5. Après vérification de l'URI publique, de la collection et du rôle, signer soi-même le **mint** dans le wallet. Attendre le reçu `success` et vérifier l'inventaire. Le Lab ne signe jamais.
6. La récompense proposée de **1 TRO pour un NFT physique vérifié** reste uniquement candidate après preuve des droits, anti-doublon, finalité et réserve ; **aucun versement automatique** n'est activé.

## Intelligence xOrus

Entrée canonique : `/intelligence/xorus` (alias court `/xorus`). Les anciennes routes `/lia` et `/intelligence/lia` restent compatibles pendant la migration. Les identifiants internes `lia/` et certains champs des snapshots restent volontairement historiques et **ne doivent pas être renommés sans migration de schéma**.

Les 120 signaux sont **définis**, pas 120 données garanties. xOrus reste paper/read-only, et aucune transaction ou acquisition de droits de redistribution n'est autorisée par un agent seul.
