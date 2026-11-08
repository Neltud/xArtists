# xArtists · Home → Marketplace → Studio · Mainnet MultiversX

Date : 8 novembre 2026. Périmètre : navigation, expérience débutant,
parcours artiste. Aucune modification des contrôles wallet, contrat, paiement,
des clés privées, des routes existantes ni du réseau blockchain.

## Parcours visible

1. Accueil — découverte sans portefeuille.
2. Marketplace — consultation, Explorer et listings soumis aux vérifications
   déjà en place.
3. Studio — actions principales réelles de l'artiste, approuvées dans son
   propre portefeuille MultiversX : issueNonFungible, setSpecialRole
   (ESDTRoleNFTCreate), ESDTNFTCreate.

Le composant MainnetJourney est partagé entre les trois pages.
Il présente chainID 1, les liens, la connexion xPortal et l'accès à
Explorer. Il ne réalise aucune opération de mutation lui-même.

## Préservation des fonctionnalités mainnet

| Fonction | Décision |
| --- | --- |
| Connexion xPortal | Préservée : WalletContext, requestOpenConnect |
| Émission de collection par l'artiste | Préservée : useStudioMintTx.issueCollection |
| Attribution du rôle NFTCreate au portefeuille propriétaire | Préservée : useStudioMintTx.setCreateRole |
| Mint de NFT artiste depuis son propre wallet | Préservé : useStudioMintTx.createNft, rôles on-chain et URI exigés |
| Lecture du portefeuille et NFT réels | Préservée : useUserAccount |
| Marketplace achats/listings | Garde canListBuyNft : flag + codehash runtime frais, inchangée |
| Staking, venue, DAO | Gardes spécifiques des contrats inchangées |
| Upload IPFS GLB | Configuration serveur signée, inchangée |
| Mint commercial Pulse #005, RWA, PayBox, trading LIA | Bloqués tant que les preuves distinctes manquent |

Un chemin de signature sur mainnet n'est pas une preuve de
transaction exécutée : seul un reçu on-chain valide confirme la réussite.

## UX et accessibilité

- Design light par défaut, dark mode conservé.
- Trois entrées claires et cohérentes, utilisables en lecture anonyme.
- Affichage sur 390px et 1440px, focus clavier visible, boutons 44px.
- Traductions dans les huit langues existantes et respect reduced-motion.
- Aucune suppression des anciennes URL ou des 126 routes publiques.

## Tests et publication

- apps/frontend/tests/mainnet-journey-ux.test.mjs valide les routes,
  la préservation des transactions mainnet, des gardes codehash,
  l'accessibilité et l'absence d'activation commerciale accidentelle.
- e2e/public-ux-responsive.spec.ts vérifie Accueil → Marketplace → Studio
  en mobile/desktop, sans signer ni initier de transfert.
- Build, TypeScript, tests CI, sécurité et capture responsive doivent être
  verts avant merge. Vérifier le SHA servi sur Pages et Render après merge.

Ne modifier aucun flag de paiement, vente, mint administrateur,
IPFS, staking, DAO, ni le trading LIA pour cette refonte UX.
