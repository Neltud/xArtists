# xArtists — stratégie Art-first et modèle économique (novembre 2026)

> Document de travail daté du **3 novembre 2026**. Les comparaisons de marché
> sont des observations ponctuelles, **pas** des engagements financiers
> ou des prévisions commerciales.

## Positionnement

**Maison d’art, de création et de provenance, augmentée par l’intelligence.**
L’architecture de la dApp doit commencer par une sélection d’œuvres et
des dossiers de provenance, pas par une grille de tokens ou une promesse
de rendements. Les espaces prioritaires sont : **Musée → Enchères →
Provenance / RWA → Studio**, puis les **Packs IA** à achat unique.

La **Marketplace** reste un outil de recherche et d’inventaire
secondaire ; LIA / DeFi demeure un desk d’information, séparé des
parcours culturels et du commerce. L’exploration publique est possible
sans wallet.

## Signaux vérifiés au 3 novembre 2026

| Acteur / secteur | Information vérifiable | Conséquence produit |
| --- | --- | --- |
| OpenSea | Frais de vente NFT typiques **1 %**, frais de mint sur primary drop **10 %** selon l'aide officielle | Ne pas supposer qu'une commission secondaire élevée sera soutenable |
| Magic Eden | Frais transactionnels **2 %** selon l'aide officielle (mars 2026), royalties selon choix / règles des produits | Ne jamais budgéter des royalties secondaires comme revenu garanti |
| Blur | **Annonce le 12 octobre 2026** de la dépréciation de **son interface le 12 novembre 2026** ; protocole on-chain maintenu | Ne pas décrire la fermeture comme déjà effective au 3 novembre |
| RWA.xyz | Environ **39,4 Md$ de distributed asset value** au 3 novembre 2026 ; métrique différente de la valeur « represented » et des stablecoins | Marché porteur mais **aucune extrapolation directe** au segment art phygital |

Sources consultées : [OpenSea help](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea),
[Magic Eden help](https://help.magiceden.io/en/articles/5858632-what-fees-will-i-pay-to-list-or-sell-nfts-on-magic-eden),
[The Block, 12 octobre 2026](https://www.theblock.co/news/ecosystems/2026-10-12-blur-nft-marketplace-shutting-down-frontend-blend-418363),
[RWA.xyz au 3 novembre 2026](https://app.rwa-xyz.com/networks).

La décision commerciale **ne découle pas mécaniquement** d’un prix de
commission concurrent ni du volume RWA agrégé. Elle doit être validée
sur des coûts d'exploitation réels, des obligations locales, la
gestion de la garde, des litiges et des retours.

## Revenus potentiels : ordre de déploiement

1. **Packs Pulse / Yield / Sentinel** : prix catalogue **110 / 75 /
   50 EUR**, achat unique sans abonnement ; coûts à soustraire :
   prestataire PSP, fraude/chargeback, gaz, stockage, service client,
   maintenance, créateur/émetteur le cas échéant. **Checkout public
   toujours fermé**. La voie technique est le **claim voucher B
   post-PayBox** avec prix SC stables (socle A).
2. **Services créateurs Studio** : frais transparents ou inclusion dans
   un pack, à définir après le premier mint artiste signé et vérifié.
   Ne pas afficher une offre marchande sans capacités effectives.
3. **Maison d'enchères / phygital** : hypothèse de travail d'une
   commission acheteur ou vendeur de **10–12 %**, à tester ; aucun
   niveau n'est lancé ni économiquement démontré. Déduire conservation,
   assurance, transport, inspection, taxes, remboursements et conflits.
4. **TCA / Whop** : abonnements récurrents distincts des droits Genesis.
5. **Secondaire et royalties** : revenus éventuels, exclus du
   budget de base. **$TRO** : éventuel usage gouvernance ou réduction de
   frais soumis à conception, pas incitation financière automatique.

## Design et parcours opérationnel

| Écran | Promesse maîtrisée | Preuve requise avant vente |
| --- | --- | --- |
| Accueil / Maison | 3 à 7 éléments sélectionnés, musée et exposition d’abord | Liens vers œuvres réelles et contexte documenté |
| Musée | Contemplation + information de collection | Médias correctement attribués, identifiant NFT si annoncé |
| Enchères | Présentation de lots / récit | Consignation, propriété, réserve, condition, règlement, ledger des bids durable et anti-sniping |
| RWA | Condition et historique physique | Documents juridiques, garde et assurance, transport et acceptation |
| Studio | Création et publication responsable | Upload autorisé, stockage IPFS, métadonnées et signature xPortal réelles |
| Packs IA | Prix clair et état du droit | S1 PayBox authentifié, B voucher unique, S2 NFT reçu, refund/revoke |

**P0 sécurité** : la [PR #313](https://github.com/Neltud/xArtists/pull/313)
a neutralisé trois workflows legacy de manipulation de prix sur mainnet.
La [PR #314](https://github.com/Neltud/xArtists/pull/314) expose le
prototype Auction P1, **désactivé par défaut**, sans base durable
ni adjudication. La [PR #312](https://github.com/Neltud/xArtists/pull/312)
prépare la spécification voucher B + A ; **elle n'est pas une livraison
fonctionnelle de claimPack**.

## Lot témoin et suivi

L'œuvre **Meteorite (2018)**, référencée dans
`apps/frontend/src/config/tuduriAtelier.ts`, sert de **témoin
éditorial uniquement**. Aucun prix, transfert, possession actuelle,
authenticité physique ou consignation n'est attesté par cette sélection.
La première mise en vente réelle nécessitera une œuvre explicitement
consignée et contrôlée avec son vendeur.

### Indicateurs pertinents

- Nombre d’œuvres dont les informations, licences et provenance sont
  réellement documentées (pas seulement nombre de « listings »).
- Nombre de créateurs ayant accompli un **premier mint vérifié**.
- Réconciliation paiements **S1** / reçus NFT **S2**, taux de
  commandes en attente et délai d'obtention des preuves.
- Litiges, remboursements, défauts de livraison, coûts réels de garde.
- Visites qualifiées du musée et conversions après consultation
  des dossiers de provenance, sans déduire la valeur d'un simple volume
  secondaire.

### Garde-fous marketing

Ne pas écrire « NFT = propriété du tableau », « royalties garanties »,
« premier achat déjà livré », « auction live » ou « LIA garantit du
rendement » sans preuve indépendante. Toute publicité doit distinguer
**ouvert à la visite**, **en préparation**, **démonstration** et
**commerce autorisé**.

Voir aussi [Maison xArtists — manifeste](presentation/maison-manifeste.md),
[critères de lancement](security/launch-gates.md) et
[prix / livraison](security/pricing-delivery.md).
