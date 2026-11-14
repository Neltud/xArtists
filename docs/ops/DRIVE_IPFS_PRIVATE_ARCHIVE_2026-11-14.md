# xArtists — Drive privé → coffre serveur → IPFS → NFT (14 novembre 2026)

**Préparation uniquement : aucun déploiement, fichier Drive importé, pin ou mint effectif.**

## Distinction essentielle

- **Drive** : sources originales privées, non-NFT, aucune URL/ID/token Drive dans le front ou les logs.
- **Serveur xArtists** : conservation des octets originaux et de leur SHA-256 sur un volume persistant privé, avec sauvegarde chiffrée hors site vérifiée par restauration.
- **IPFS** : publication explicite d'une copie autorisée, après vérification des droits. Utiliser Pinata ou un Kubo séparé ; un CID ou deux gateways ne garantissent pas une durée de conservation.
- **MultiversX** : NFT dans la blockchain après la signature volontaire de l'artiste. Notre serveur conserve **médias, fichiers originaux, métadonnées et preuves**, pas le token blockchain.
- **Marketplace** : seulement les NFT récupérés depuis la chaîne et l'index externe non vérifié avec identifiant NFT valide. Les vignettes Drive ne sont plus les premiers NFT factices du catalogue.

Les visuels d'atelier historiquement visibles au musée ou sur l'accueil sont des aperçus artistiques, **pas** des mint ou annonces et ne démontrent pas les droits. Le retrait du catalogue n'efface pas les originaux de Drive ni les fichiers déjà publiés historiquement.

## Archiver sur un serveur privé déjà contrôlé

`scripts/ops/archive-drive-original.mjs` accepte uniquement une **copie locale sélectionnée par un opérateur autorisé** (pas une URL/ID Drive), après consentement et déclaration de droits pour chaque œuvre. Contrôle octets JPG/PNG/WebP/MP4, SHA-256, taille, symlinks, permissions du coffre, conflits, doublons ; aucune écriture IPFS ni wallet ni paiement.

Exemple opérateur sur son propre serveur (chemins fictifs, **ne pas lancer sur une machine publique**) :

```sh
install -d -m 700 /srv/xartists/private-originals
node --test scripts/ops/archive-drive-original.test.mjs
node scripts/ops/archive-drive-original.mjs \
  /srv/xartists/intake/oeuvre-consentie.png \
  /srv/xartists/private-originals \
  --approve-private-archive --rights-declared
```

Le reçu JSON ne révèle aucun identifiant Drive. Conserver les reçus d'archives et preuves de droits dans un registre privé chiffré. Préparer une sauvegarde hors site et une restauration testée. Le fait d'archiver un fichier n'en prouve pas la propriété intellectuelle.

## Kubo sur OVH (option sans abonnement Pinata supplémentaire)

`deploy/ipfs/compose.yaml` est **inactif**. Il requiert `XARTISTS_KUBO_IMAGE` (version + digest préalablement vérifiés) et `XARTISTS_KUBO_DATA_DIR` (chemin absolu d'un volume privé persistant hors dépôt). Cela utilise l'infrastructure existante : frais de serveur, disques, sauvegardes et trafic restent applicables.

Sur le serveur privé : définir ces variables de manière sûre, vérifier l'image, l'espace disque, les ports 4001 et la sécurité, puis inspecter `docker compose -f deploy/ipfs/compose.yaml config` avant tout déploiement. L'API RPC 5001 et le gateway 8080 doivent rester **sur loopback uniquement**. Le coffre des originaux n'est pas monté dans Kubo et le fichier compose n'autorise aucun mint ni upload public.

Cette configuration n'est **pas** encore connectée à `creatorMedia` : l'upload Studio courant dépend de Pinata JWT + DB + xPortal/SIWX. Pour une alternative Kubo intégrée, développer plus tard un adaptateur backend authentifié, quotas, audit, vérifications CID et réconciliation sans double publication. Ne jamais exposer directement Kubo au navigateur.

Avant d'affirmer l'intégrité IPFS : lire les octets complets et comparer SHA/tailles ; pour une redondance indépendante vérifier le pin chez deux opérateurs réellement séparés et effectuer une restauration. Référence : `docs/CREATOR_MEDIA_UPLOAD_IPFS.md` et tests du script `ipfsPinAudit`.

## Ordre des portes restant fermées

1. **#506 Reown** : allowlist `https://xartists.art` et `https://www.xartists.art` sur le projet réellement contrôlé, puis preuve QR + session approuvée dans xPortal.
2. **Studio 503** : identifier le Postgres du runtime API, sauvegarder, vérifier migrations 004→005→006, JWT, quota, statut, auth Pinata ou backend Kubo futur.
3. **Upload de recette autorisé** : fichier choisi par l'artiste, droits, SHA, pin et récupération indépendante, metadata JSON.
4. **Mint** : collection NFTCreate, signature du wallet artiste, hash et confirmation Explorer. Aucun mint automatique.
5. **Vente #428** : listing signé, achat, livraison au wallet acheteur et reçus indépendants.

Aucun flag commercial, financier, mint ou trading ne doit être relevé par ce chantier.

## Tests

```sh
node --test scripts/ops/archive-drive-original.test.mjs
node --test apps/frontend/tests/marketplace-mobile-editorial.test.mjs
npm run typecheck --prefix apps/frontend
npm run build --prefix apps/frontend
```
