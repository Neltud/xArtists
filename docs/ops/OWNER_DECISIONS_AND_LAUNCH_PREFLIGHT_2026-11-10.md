# xArtists — décisions du propriétaire et préparation des opérations (10 novembre 2026)

> **Document préparatoire / proposition de PR.** Cette page retranscrit les six cases cochées par le propriétaire dans la conversation du 10 novembre 2026. Une case cochée est une **orientation / autorisation de préparation** ; elle ne remplace ni une preuve technique, ni un contrôle juridique, ni une approbation de transaction précise. Document en revue : aucune capacité commerciale n'est activée par ce texte.

## Posture décidée

- **GO de principe : publication publique sans commerce**, sous réserve de vérifier le SHA déployé, les parcours public sans wallet, les annonces de statut et les tests de sécurité/accessibilité. Le déploiement n'est pas déclenché par cette PR.
- **NO-GO inchangé :** encaissement fiat, achat EGLD, mint NFT, listing/enchères, distribiteur, escrow, RWA, trading LIA, bridge $TRO et tout droit « livré » par un simple événement navigateur.
- **MultiversX mainnet :** lecture publique des contrats et NFT possible, opérations signées interdites sans accord distinct sur les données exactes de la transaction, y compris chaîne, contrat, destinataire, valeur et frais.
- **Comptes utilisateurs :** distinguer compte sans wallet, compte avec wallet vérifié et rôle opérateur/admin. Aucun wallet saisi en texte ne prouve le contrôle. Les comptes sans wallet peuvent découvrir l'offre ; ni mint ni achat EGLD sans signature.
- **Rails souhaités :** abonnement fiat EUR via PSP hébergé *et* achat EGLD signé sur MultiversX, selon produit et droits réels ; ne pas créer de rail implicite Solana/Polygon. Génération, packs, abonnement et prestation physique ne doivent pas partager artificiellement la même preuve de paiement.
- **Séparation des décisions :** accord artistique, politique tarifaire, contrôle wallet, préparation de l'infrastructure, conformité commerciale et permission de signer sont des gates distincts.

## Décisions recueillies et preuves toujours nécessaires

| Validation utilisateur cochée | Ce qu'elle autorise à préparer | Ce qui reste à prouver / à approuver séparément |
| --- | --- | --- |
| Lancement public sans commerce | Checklist de recette et PR de présentation/documents ; publication envisagée uniquement en lecture/demo | SHA réellement servi, tests CI/route/mobile, contrôles « paper/off », rollback et GO sur un artefact précis |
| Politique des prix | Harmoniser textes, catalogue et rails ; dresser un tableau produit→paiement→droits | Le catalogue documentaire Pulse 110 €, Yield 75 €, Sentinel 50 € n'est **pas** une quote exécutable ni un feu vert à une vente. Les lectures historiques 1/5/2,5 EGLD ne sont **pas** une parité EUR. Revalider prix exacts, nature de l'abonnement, taxes, frais, expirations et source serveur |
| Wallets propriétaires | Cartographier les rôles collection owner / minter / bénéficiaire / LIA ops ; documenter la procédure de preuve | Challenge signé et readback mainnet récent des rôles/permissions, codehash/ABI, multisig ou contrôle opérateur réel, sans clé secrète |
| IPFS + PostgreSQL production | Préparer les vérifications en lecture seule, les migrations à relire et le plan de reprise | Identité DSN Render↔base de production, sauvegarde/restauration, migrations, quotas, auth Pinata et droit de pin, CID et SHA des octets, double pin indépendant ; **aucune migration ni activation** par cette validation seule |
| Publication artistique NFT Pulse #005 | Préparer manifeste final et dossier droits/médias pour une création *owner-only* non commerciale | Déclaration précise des droits sur les fichiers retenus, hashes des originaux, CID final et double readback, version déployée du minter, rôle NFTCreate, nonce non pris, contrôle du destinataire ; **signature wallet distincte** puis receipt on-chain avant le mot « minté » |
| Paiements / domaine / licences | Préparer les fiches de recette PSP, DNS/MX, politique logicielle et mentions | PSP/abonnement actif par événement signé et remboursement prouvés, livraison atomique S1/S2, résolution registrar/DNS et tests courrier, termes de licence validés (notamment #416). Aucun paiement, rétablissement domaine ou enregistrement juridique n'est présumé |

## Travaux à mener dans cet ordre

### Lot A — prêt pour le public, sans commerce

1. Étiqueter clairement tous les modes : `live on-chain read-only`, `paper/demo`, `indisponible`, avec source et horodatage des signaux. LIA sans trading, DAO locale sans vote on-chain annoncé, OpenSea en découverte seulement.
2. Revue navigations/routes/modules : accueil clair par défaut, dark toggle, parcours novice « découvrir → créer → collectionner → participer », annuaire et accès aux modules non supprimés, UX FR/EN, 360/390/430 px, desktop, clavier, contrastes, motion réduite.
3. Vérifier les tests `npm run test:release`, `npm run check:routes`, `npm run verify:site`, `npm run typecheck`, `npm run build`; archiver sorties, commit exact et SHA du build public. Vérifier les liens GitBook/README/mentions légales et le rollback.
4. *Après* revue du dossier et des preuves, autoriser explicitement la seule publication non commerciale. Ne pas modifier les flags checkout/mint/trading.

### Lot B — production IPFS, DB, wallets (préflight seulement)

1. Faire rapprocher par l'opérateur Render le DSN effectif avec le projet PostgreSQL attendu **sans révéler URL ou secret** ; consigner uniquement identifiants non sensibles, migrations applicables, disponibilité, sauvegarde/restauration, concurrence multi-workers.
2. Effectuer la sonde sans écriture `cd services/access-api && npm run preflight:studio:ipfs`, depuis l'environnement effectivement visé. Vérifier la table `xartists_studio_media`, colonne `metadata_sha256`, contrainte et index quota. `ok: true` ne signifie ni pin réussi ni production opérationnelle.
3. Confirmer via le compte Pinata autorisé le jeton serveur dédié, ses permissions, sa facturation/plafonds et la politique de contenu. Ne jamais exposer JWT en chat, issue, PR ou `VITE_*`. Tester pin de vrais médias **uniquement dans une recette distincte autorisée** ; relever CID, SHA-256, octets et réplication indépendante.
4. Relever les rôles mainnet de collection owner, minter et wallets destinataires depuis Explorer/VM ; obtenir une preuve de contrôle signée si le flux admin le requiert. Aucune signature demandée depuis ChatGPT.
5. Tenir le manifeste Pulse #005 en `draft_unminted` tant que le couple contenu/URI/droits/nonce/SC n'est pas certifié.

### Lot C — paiements et licences, toujours désactivés

1. Produire la matrice produit : (abonnement EUR PSP, achat EGLD signé), conditions, droits livrés, annulabilité, support, remboursement, taxes et frais. Vérifier que les montants on-chain et les devis n'induisent pas de prix fictif.
2. Tests PSP **sandbox** : webhooks/IPN signés, anti-rejeu, persistance PostgreSQL, concurrence, interruption/reprise, `paid` ≠ `delivered`, remboursement/révocation ; paiement EUR live interdit avant feu vert distinct.
3. Tests EGLD **testnet** avec deux wallets volontaires : propriété/nonce, offre, listing, règlement, frais, royalties, réception NFT et retour des soldes ; puis audit indépendant et micro-pilote mainnet signé séparément.
4. Domaine `xartists.art` : inspection registrar (un `clientHold` a été rapporté en #341/#476), délégation DNS, MX, SPF/DKIM/DMARC, réceptions *et* réponses testées avant communication publique de l'adresse. Pas de changement d'enregistrement par cette PR.
5. XA World Rights : trancher entre logiciel propriétaire redistribué avec CGU vérifiées ou client MIT + service payant ; vérifier l'origine des sources, dépendances et l'exemption owner prouvée par signature. Aucun « dépôt de licence au nom du propriétaire » présumé.

### Lot D — développement parallèle des modules

- **Comptes/auth #465** : identité serveur, email vérifié, sessions, SIWX nonce unique, liens wallet, souscriptions et entitlements révocables.
- **Studio/Genesis #403, PR #407** : droits, hash, IPFS, contrat minter, rendu NFT #005 et preuve de réception ; une publication artistique n'est pas un mint.
- **Marketplace #428, #391** : découverte MultiversX/Polygon/Solana ; listing, vente, enchères et mint natifs hors GO.
- **RWA #430** : garder l'escrow fermé tant que conservation de preuves, stockage historique, attestateurs et droits physiques ne sont pas audités.
- **LIA #347, #367, PR #454** : fraîcheur des sources, journal paper, aucune exécution financière.
- **UX/DAO #348, #393** : tous les modules accessibles selon niveau public/lab/opérateur ; votes DAO locaux explicitement non on-chain.

## Dossier de preuve / décision par capacité

Pour chaque autorisation future, enregistrer dans la PR ou issue concernée : (1) capacité exacte et non globale, (2) environnement, (3) commit/build SHA, (4) commande/test + sortie + date, (5) identité du responsable de revue, (6) risques/rollback, (7) preuve d'exécution indépendante, (8) **accord humain transaction-spécifique** en cas de signature, dépense, émission ou modification sensible.

**Prochain GO envisageable :** public **sans commerce**, si l'artefact déployé et les parcours sont vérifiés. **Tout GO commercial/mainnet signant reste en attente**, même si les six décisions de cadrage ont été cochées.

## Références actives

- [Critères de lancement](../security/launch-gates.md)
- [Mint artiste](../FIRST_ARTIST_MAINNET_MINT.md)
- [Comptes sans/avec wallet #465](https://github.com/Neltud/xArtists/issues/465)
- [Livraison réelle / PostgreSQL #281](https://github.com/Neltud/xArtists/issues/281)
- [Mint Pulse #005 #403](https://github.com/Neltud/xArtists/issues/403)
- [Market mainnet #428](https://github.com/Neltud/xArtists/issues/428)
- [Domaine #341](https://github.com/Neltud/xArtists/issues/341)
- [Licence #416](https://github.com/Neltud/xArtists/issues/416)
- [UX #348 / #393](https://github.com/Neltud/xArtists/issues/348)
