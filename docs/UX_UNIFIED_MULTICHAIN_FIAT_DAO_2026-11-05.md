# xArtists — expérience unifiée, multichaîne et fiat (architecture UX)

Date : 5 novembre 2026 · Lot 1 : simplification du parcours public, navigation DAO et reconnaissance honnête des moyens de paiement/réseaux.

## Principe produit

**L'utilisateur choisit une intention, pas une blockchain.** Explorer des œuvres, créer, voir des NFT ou participer aux décisions de la communauté sont les quatre entrées primaires. La navigation complète reste disponible en un clic via **Tous les modules**, la recherche et le menu mobile. Les informations techniques (wallet, gas, chain ID, IPFS, contrats, vesting) apparaissent au moment où elles sont nécessaires, avec une explication simple et un mode avancé explicite.

« Seamless » signifie **parcours cohérent, étapes lisibles et confirmations fiables**, jamais transfert automatique de fonds/actifs entre blockchains ni paiement en production avant preuve.

## Ce que le premier lot change effectivement

- Home : moins de sections simultanées, pas de scène WebGL chargée d'office, quatre cartes d'intention compréhensibles, navigation complète, volet réseaux/Euros et détails avancés repliés.
- Header : Explorer, Créer, Marché, DAO, Tous les modules ; mobile : Accueil, Explorer, Créer, Marché, DAO et menu complet. Le pied de page et la recherche couvrent toutes les familles. Les modules « lab » restent consultables depuis le catalogue mais affichent un statut de présentation au lieu d'un faux « live ».
- DAO : visible depuis le menu, le dock, la page d'accueil et les liens du site. Les propositions actuelles ne sont **pas** des votes on-chain ; la page les identifie comme simulations et le stockage reste `onChain:false` sans signature. L'ancien texte laissait penser qu'une capacité de vote réelle était enregistrée malgré un simple localStorage.
- Application/portefeuille : explication du parcours MultiversX (xPortal) et des vues NFT Polygon/Solana via OpenSea ; option Euros visible mais checkout public désactivé.
- Localisation : textes d'accueil et de statut simples dans les huit langues présentes ; exploration sans wallet ; mise en page mobile 390 px et modes de contraste clair/sombre existants.
- Aucun flag d'activation financière, secret, wallet de production, paiement, mint, bridge, staking, ordre OpenSea ou transaction DAO n'est modifié.

## Matrice de disponibilité honnête (lecture, à revalider sur le runtime)

| Parcours utilisateur | MultiversX | Polygon | Solana | Euros |
|---|---|---|---|---|
| Découvrir les œuvres NFT | Catalogue xArtists/Explorer, selon index réel | Catalogue OpenSea si clé API et collection supportée | Catalogue OpenSea si clé API et collection supportée | Sans paiement |
| Préparer une création | Studio xArtists (prévisualisation, upload selon configuration) | Préparation de médias seulement ; mint Polygon natif xArtists à construire | Préparation de médias seulement ; mint Solana natif xArtists à construire | Devis/produit en EUR possible, paiement public fermé |
| Acheter/vendre | Contrats et statut vérifié exigés ; pas de GO implicite | Liens externes OpenSea ; ni transaction ni signature xArtists | Liens externes OpenSea ; ni transaction ni signature xArtists | PayBox et Stripe sous gates séparées #281/#370 ; aucun checkout ouvert |
| DAO | Découverte des propositions, **vote local simulé** | Pas de vote natif Polygon vérifié | Pas de vote natif Solana vérifié | Pas de vote fiat |
| LIA/trading/bridge | PAPER/lecture ou off selon module | Off sauf exploration | Off sauf exploration | Aucun financement automatique |
| Wallet | xPortal/MultiversX | Wallet EVM externe sur fournisseur ; connexion xArtists non livrée | Wallet Solana externe sur fournisseur ; connexion xArtists non livrée | Checkout hébergé après S1/S2 |

Un compte « universel » et un portefeuille qui transfère silencieusement des actifs entre chaînes **n'existent pas encore**. Le site ne doit pas en simuler le fonctionnement.

## Architecture cible — solution réellement multichaîne et fiat

### Couche 1 — identité / consentement
- Associer un profil xArtists à plusieurs adresses **sans les confondre** : MultiversX, Polygon EVM (chain ID 137) et Solana (cluster authentifié).
- Challenges signés spécifiques au réseau, nonce et expiration, protection contre replay, preuves d'appartenance, mécanismes de révocation et consentement par action.
- L'artiste IA délégué agit uniquement dans un mandat limité signé par l'humain ; les modules sensibles refusent les consentements implicites.

### Couche 2 — catalogue / devis indépendant du réseau
- Un objet produit : `id, artwork, rights, network, standard, media_uri, owner, pricing_currency, gross_price_atomic, fees, royalties, available_actions, quote_expiry, source_sha`.
- Les **prix sont exprimés en EUR ou dans une unité on-chain vérifiée**, avec frais et conversion explicitement présentés ; aucune devise supposée interchangeable et aucun taux inventé.
- Un NFT affiché via OpenSea ne prouve pas qu'un listing exécutable existe. Pour les offres, vérifier le maker, le contrat, le token, le réseau, la signature, l'expiration, les frais et l'état de l'ordre.

### Couche 3 — paiement / settlement / livraison
- Choix de l'utilisateur : `Voir`, `Créer`, `Acheter en euros` ou `Payer en crypto` **selon les capacités réellement ouvertes**.
- EUR : prestataire de paiement hébergé ou API conforme ; `payment_intent -> webhook/IPN signé -> écritures atomiques -> fulfillment -> finalité on-chain -> ownership confirmé -> reçu`.
- Crypto : wallet du **réseau cible**, révision de la transaction, frais affichés, signature à l'initiative de l'utilisateur, suivi et reprise idempotente.
- Toute commande passe par une machine à états durable (created, pending, paid_verified, mint_pending, delivered_on_chain, cancelled/refunded/failed) ; aucun `delivered_at` sur simple paiement ou dispatch.
- Une défaillance du bridge, du RPC, de l'indexer ou du prestataire ne doit jamais produire de succès imaginaire. Réconciliation, résolution des litiges et remboursement par rail.

### Couche 4 — composants transversaux et navigation
- Un système de design responsive avec un **statut humain** : Disponible, Découverte seulement, Démonstration ou En préparation. Éviter « LIVE » sur données périmées, votes locaux, NFT non indexés ou clés API configurées sans parcours réel.
- Une interface lisible sur smartphone en priorité ; boutons >=44px, contrastes AA, clavier/focus, erreurs compréhensibles, langues cohérentes.
- Un menu global affichant toutes les fonctionnalités sans leur attribuer artificiellement un statut commercial.
- Un observateur de capacité versionné et cache court, branché sur le backend (non sur des flags frontend copiés) pour activer les boutons **uniquement** après preuves S1/S2.

## Couverture de tous les univers

- **Explorer** : Maison, musée, Marketplace, enchères, art physique, visites, analytics, éditions, lieux.
- **Créer** : Studio, NFT Factory/Distributeurs, jumeau numérique, Académie, visibilité.
- **Intelligence** : LIA, agents, command center, Lightning, simulation, réseau des agents.
- **Finance & DAO** : $TRO, vente, staking, liquidité, Hatom, Burnify, gouvernance, soutien et trading (status strict).
- **Espace personnel** : portefeuille, portfolio, packs, identité, paiements, historique, statuts et mentions légales.

Toutes les routes peuvent être trouvées depuis le catalogue et la recherche ; l'ordre d'affichage initial privilégie la découverte. **Exister dans la navigation n'autorise aucune action financière.**

## Travaux distincts pour un vrai GO multichaîne/fiat

1. P0 : navigation simplifiée + DAO clairement en démo + recherche catalogue exhaustive, CI route/i18n/TS/build et smoke smartphone et desktop (cette PR).
2. P1 : API de capacités indépendantes du frontend, wallets EVM et Solana avec SIWx par réseau, liaison d'identité, vérification on-chain et test d'accessibilité.
3. P1 : prix / devis unifiés, rails EUR/crypto documentés, frais et expiration, modèles légaux, sans auto-conversion.
4. P0 finance : livraison réellement atomique #281 et anti-rejeu claim #328, tests de concurrence PostgreSQL, anti-doublons, remboursements et support humain.
5. P2 : création et listing Polygon/Solana #391, indexation vérifiée, signature wallet, reorg/finality, marketplace crosschain sans custodie implicite.
6. P2 DAO : registre public de propositions authentifiées, source vérifiable, preuves de vote, bilan/stake, délégation avec révocation et contrat **audité** ; voter réellement doit être un flux distinct du prototype local.
7. P2 : achat en EUR dans le contexte d'un produit uniquement après PSP S1/S2 et licence/conditions remplies ; jamais un bouton « Acheter » alimenté par un simple flag.
8. Revue indépendante d'un même parcours **visiteur sans wallet → oeuvre → réseau choisi → devis authentique → signature/PSP → preuve → espace personnel**, sur desktop/mobile et toutes langues, puis go/no-go par fonctionnalité.

## Non-objectifs de cette livraison

- Aucune garde des clés, vente ou mise aux enchères réelle, ordre Polygon/Solana, bridge TRO, création NFT mainnet, carte débitée, airdrop ou vote officiel. « Fiat seamless » est une **cible d'architecture**, non un service déjà ouvert.
- Ne pas connecter de wallet Solana au modal xPortal : les réseaux et la capacité de signature sont incompatibles. Le choix doit être explicite.
- Ne pas faire de promesse que toutes les collections Solana apparaîtront sur OpenSea.
