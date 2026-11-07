# xArtists — Go-live mainnet Public NFT / EGLD / xPortal : verdict de sécurité

**Date : 7 novembre 2026 (Europe/Paris).** Cette note prépare un démarrage vérifiable ; **elle ne donne aucune permission d'armer des ventes** et ne prouve aucune transaction créée dans ce sprint.

## État vérifié / limites des preuves

- **Site** : GitHub Pages publié au commit `c3b56e51039154431eadebe94dad5434d4fb73ca`, version `0.129.1`. Musée/marketplace/roadmap et quatre œuvres Drive accessibles. **Aucune œuvre Drive n'a été mintée par cette livraison**.
- **Marketplace NFT** : contrat mainnet réellement déployé à `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm`. Explorer au 07/11 indique `codeHash=8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=`, `isPayable:true`, `isPayableBySmartContract:true`, upgradeable, owner = wallet de déploiement. Ne pas confondre avec l'ancien placeholder `erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t`. **L'ancienne documentation d'erreur payable est historique** ; la transaction antérieure en échec n'a pas été re-diagnostiquée en détail. Ces propriétés ne prouvent **pas** un parcours actuel achat→NFT reçu ni remboursement/escrow. Source : https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm .
- **Trois packs (Pulse/Yield/Sentinel)** : wallet owner `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`. Rôles manquants : `ESDTRoleSetNewURI` + `ESDTRoleNFTUpdate`; aucun média prouvé sur IPFS / double pin. Six tokens existants, Pulse #005 absent. NO-GO pour vente de ces packs.
- **Wallet LIA** `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` : trésorerie/protocole en lecture dans l'app, **non interchangeable** avec wallet de déploiement/owner `erd1kex0…` ni wallet admin détenteur `erd1mmh2…`. La dApp empêche délibérément de l'utiliser en tant que wallet user ; aucune exportation PEM vers xPortal n'est requise.
- **Wallet public** : xPortal/WalletConnect (QR/deep-link), Web Wallet et extension DeFi sont câblés dans l'UI ; l'intégration directe de Ledger et la compatibilité exhaustive de tous les navigateurs n'ont pas été testées en production. La configuration `ledger:true` à elle seule ne prouve pas un parcours Ledger testable. Un simple affichage `erd1` sans session signante reste consultation seule.
- **Distributeur** : `/create/nft-factory` papier seulement; aucun SC `deployDistributor`/`depositInventory`/`buyRandom` audité et déployé, hasard non vérifiable économiquement. Jamais envoyer un NFT directement à une adresse supposée du distributeur.

## Correctifs de sécurité de cette PR (aucun paiement activé)

1. `runtimeCodehash.ts` : le marketplace doit vérifier **codeHash identique ET `isPayable:true`** sur un snapshot réseau récent, outre le flag de build ; une API indisponible ou non-payable doit fermer l'accès.
2. `useMarketplaceTx.ts` : un wallet utilisateur effectivement capable de signer est obligatoire ; les montants EGLD sont parsés en **BigInt à partir d'une chaîne décimale exacte, 18 décimales**, sans `Math.round(number*1e18)`.
3. Les composants de vente transmettent les chaînes d'entrée exactes ; un `sessionId` WalletConnect n'est pas une preuve d'achat, liste ou enchère confirmés.
4. Le wallet LIA est bloqué également lors d'une restauration WalletConnect et reconnu par les gardes communs.
5. Tests négatifs : arrondi, trop de décimales, rôle wallet LIA, signature manquante, payable et session ID.

## Chantiers pour un GO réel

| Priorité | Chantier | Vérification avant de libérer une action publique |
|---|---|---|
| P0 | Accès wallet / signer | xPortal Android et iOS, DeFi extension, Web Wallet ; session signante, changement de compte, rejet, timeout, retour app, WalletConnect QR ; aucun PEM/seed dans l'app |
| P0 | Mint artiste | collection et propriétaire actuels, `ESDTRoleNFTCreate` au signer ou SC correct, art approuvé, CID SHA, metadata, mint testnet réussi puis mainnet avec approbation exacte, nonce et NFT reçu |
| P0 | IPFS durable | deux pins indépendants, double téléchargement SHA, backup + test restauration, URI on-chain non vide et wallet affiche l'image |
| P0 | Marketplace EGLD | ABI/codehash/code metadata actuel, getters listing/stock, prix exact, split frais/royalties, tests testnet `listNft→buyNft→delivery` et `placeBid→acceptBid/withdrawBid→settlement/refund`, trace wallet buyer/seller |
| P0 | Distributeur NFT | SC escrow/lazy mint construit, tests VM/multi-wallet, tirage équitable anti-manipulation, audits, limites/mécanisme de remboursement, déploiement signé et inventaire réconcilié |
| P0 | Packs accès | 3 grants signés `setSpecialRole` par owner, vrais médias de packs distincts des œuvres Drive, `ESDTSetNewURIs` par nonce, readback sur chaîne et reçu réel ; #281/#402/#403 |
| P1 | Public access | ouverture lecture sans wallet ; boutons de vente seulement sur inventaires prouvés, libellés en français clair, mobile, erreurs et reprise |
| P1 | Commercial / sponsors | domaine et contact privé DNS/MX #341, juridique, facture, contrats et métriques réelles ; pas de sponsor vendu par la maquette |

**Aucun secret ou flag financier n'est changé par cette PR.** Les tests CI valident le code, pas l'exécution financière. Aucun `buy`/`bid` mainnet public sans nouveau GO après preuve de flux testnet et contrôles de contrats. Les signatures sont prises **uniquement par le wallet autorisé** sur les transactions revues par le détenteur.

Références : [docs MultiversX wallets](https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-signing-providers/), [NFT collection roles](https://docs.multiversx.com/tokens/nft-tokens/), [distributeurs](../NFT_FACTORY_DISTRIBUTORS_PAPER_TO_LIVE.md), issues [#281](https://github.com/Neltud/xArtists/issues/281), [#328](https://github.com/Neltud/xArtists/issues/328), [#402](https://github.com/Neltud/xArtists/issues/402), [#403](https://github.com/Neltud/xArtists/issues/403).
