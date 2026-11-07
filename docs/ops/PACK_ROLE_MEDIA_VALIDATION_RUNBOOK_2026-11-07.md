# xArtists — Contrôle reproductible des rôles et des médias (NO-GO)
**Date : 7 novembre 2026.** Les scripts ci-dessous sont **uniquement en lecture / validation**. Rien n'est signé, transmis à MultiversX, épinglé sur IPFS ou vendu.

## 1. Contrôler les trois payloads non signés

Depuis la racine du dépôt :

```bash
cd apps/frontend
npm ci
node scripts/verify-pack-role-manifest.mjs ../../docs/ops/PACK_ROLE_GRANT_UNSIGNED_2026-11-06.json
node --test tests/pack-role-grant-preflight.test.mjs
```

La sortie attendue est `ok: true` mais son statut reste **`NO_GO_REVIEW_ONLY`**. Ce succès signifie uniquement :
- destinataire = contrat système ESDT ;
- expéditeur et bénéficiaire des deux rôles = wallet propriétaire attendu ;
- 3 collections différentes, 1 payload `setSpecialRole` par collection ;
- rôles exactement `ESDTRoleSetNewURI` et `ESDTRoleNFTUpdate` ;
- aucun payload signé, aucun nonce, aucune signature ni rôle additionnel.

Il ne prouve pas que le propriétaire contrôle encore le wallet, que son nonce est disponible, que la chaîne a accepté les rôles ou que les droits ont été effectivement ajoutés. Avant chaque signature, l'administrateur Grok doit obtenir un **nouvel état on-chain** et faire approuver le détail au propriétaire dans le wallet de confiance. Aucun accès à la seed, aucune signature automatique.

## 2. Contrôler un média de pack seulement après un vrai CID

```bash
cd apps/frontend
cp ../../docs/ops/PACK_MEDIA_READBACK_REQUEST_TEMPLATE_2026-11-07.json /tmp/xartists-pack-readback.json
# L'opérateur remplace dans le fichier local les valeurs null par le CID IPFS réel,
# l'empreinte SHA-256 de l'original et l'identifiant d'un des 6 NFT existants.
node scripts/verify-pack-media-readback.mjs /tmp/xartists-pack-readback.json
node --test tests/pack-media-readback.test.mjs
```

Le test réseau est **lecture seule** et utilise uniquement deux gateways publiques HTTPS approuvées dans le script, avec timeout et limite de taille. Il compare le MIME, les octets et l'empreinte SHA-256 attendue.

En cas de réussite : `status: READBACK_ONLY_PINNING_UNPROVEN`, `readbackConfirmed: true` mais **`independentPinsVerified: false` et `repairAllowed: false`**. Deux gateways peuvent récupérer les octets depuis **le même nœud** : le test ne prouve jamais une double réplication. Une preuve séparée de deux fournisseurs IPFS indépendants, un export CAR/sauvegarde et un test de restauration restent obligatoires.

La liste de contrôle pour les **six NFT**, tous à l'état `NO_GO_NO_REAL_CIDS`, est `PACK_MEDIA_EVIDENCE_REGISTER_2026-11-07.json`. Aucun fichier privé de Google Drive n'est automatiquement associé à un NFT de pack `product:access`.

## 3. Réparation et vente : interdictions maintenues

1. Le propriétaire signe individuellement les trois attributions `setSpecialRole`, après examen en wallet et vérification de l'état actuel ; les hash de succès et les rôles réels sont relus on-chain.
2. Les médias **spécifiques aux packs**, dont les droits de diffusion ont été validés, sont enregistrés sur IPFS et sauvegardés, avec CIDs et SHA-256 prouvés indépendamment.
3. Seulement après toutes ces preuves, une procédure **distincte** de réécriture `ESDTSetNewURIs` par nonce peut être revue et signée par le rôle autorisé. Ne pas inventer Pulse #005 (nonce absent au dernier verdict).
4. Une vente ne peut être autorisée qu'au détenteur actuel du nonce, après preuve de média, vérification du contrat/escrow, affichage des frais, test de règlement et livraison; les droits d'accès IA ne doivent pas être présentés comme des droits d'auteur.

**Aucune des phases 1–4 ne peut être marquée terminée par la réussite de cette CI.** Les preuves publiques de la veille sont historiques et ne remplacent jamais un contrôle actuel avant signature.

Sources : [documentation MultiversX NFT](https://docs.multiversx.com/tokens/nft-tokens/) ; [dossier technique de vérification](./PULSE_ROLE_VERDICT_2026-11-06.md).
