---
description: >
  xArtists xArt-ID : empreinte originale, reconnaissance de similitudes,
  provenance et reassessment NFT on-chain, avec décision curatoriale humaine.
---

# xArtists xArt-ID — reconnaissance, provenance et réévaluation des œuvres (v1)

> **Phase 0 — moteur pur + tests, pas d'endpoint ni de vérificateur tiers connecté.**
> Aucune œuvre, aucune personne et aucun NFT n'est « certifié authentique »
> par cette version. Aucun résultat INTERPOL ou ALR réel n'a été interrogé.
> Aucune autorisation mint/checkout/PayBox n'est créée.

## Ce que nous identifions réellement

Une œuvre n'est pas uniquement un JPEG ou un NFT. xArt-ID sépare :

1. **Œuvre / édition** : auteur revendiqué, titre, technique, format physique,
   année, numéro de série ou tirage, mentions et documents datés.
2. **Original numérique** : SHA-256 des octets originaux, MIME validé,
   références et hash des variantes (scans, images retouchées, vidéo).
3. **Empreintes perceptuelles** : pHash 64 bits, futurs embeddings visuels et
   détails photographiques de signature/craquelures/dos, **uniquement comme
   signal de ressemblance**. Même pHash ≠ même œuvre, artiste ou propriétaire.
4. **Provenance documentaire** : attestations signées, factures, inventaires,
   catalogues d'exposition, transferts de garde, consentements, droits de
   reproduction et droits de mint **distincts** des titres de propriété.
5. **Vérifications externes** : origine et fraicheur des résultats, autorisation
   de l'accès, correspondances possibles, disputes et limites de couverture.
6. **NFT on-chain** : réseau exact, collection ESDT réelle, nonce, mint tx,
   créateur/issuer, holder actuel, IPFS/media/metadata URI, digest, transferts,
   changements de métadonnées et frais ; les noms/tickers affichés sont copiables.

Une identité technique de dossier xArt-ID est une **ancre de dépôt**, pas
un titre légal ni une preuve qu'il s'agit de l'œuvre originale mondiale.
La formule v1 est :

```text
xart:v1:<SHA256("xartists/art-id/v1\\0" +
  u32be(len(namespace)) + utf8(namespace) +
  u32be(len(master_sha256_hex)) + ascii(master_sha256_hex) +
  u32be(len(edition_id)) + utf8(edition_id))>
```

Domaine d'artiste : namespace vérifié côté serveur, avec signature de
possession de la clé/identité et contrôle de droits **avant** publication.
Deux créateurs revendiquant la même image peuvent générer deux ancres :
cela indique des dépôts concurrents et appelle une revue, pas une
authenticité automatique. Les dérivés et photos servent de preuves annexes.

## Échelle de preuves (pas de « score magique »)

| Étape | Contrôle | Interprétation |
| --- | --- | --- |
| A — fichier | SHA-256, cohérence original/scan | Même octets ou divergence ; aucune preuve d'auteur |
| B — signature source | C2PA/Content Credentials, certificat, révocation | Intégrité et origine de la revendication, pas vérité artistique |
| C — vision | recherche visuelle, pHash/embeddings/micro-détails | Candidats similaires ; faux positifs et négatifs possibles |
| D — provenance | documents successifs, dates, droits, expert | Chaîne probante ou lacunes, avec revue humaine |
| E — registres | INTERPOL, Art Loss Register, tiers autorisés | Correspondance signalée ou recherche réellement documentée |
| F — blockchain | MultiversX chain + token ID + nonce + tx + metadata hash | État du jeton, pas titre physique ni copyright |
| G — acceptation | conservateur/ayant droit/juriste | Avis documenté, signé, révisable et révocable |

**Règle vol :** un contrôle `no_match_reported` n'implique jamais
« non volé ». INTERPOL requiert un accès autorisé et prévient que les
absences de sa base ne sont pas libératoires. L'Art Loss Register réalise
des recherches professionnelles suivant ses conditions. Ne pas créer de
connecteur qui contourne leurs droits d'accès, anti-bot, confidentialité
ou droits de reproduction.

**Règle C2PA :** un manifeste signé peut appuyer la provenance d'un
média. Il ne démontre ni création artistique, ni authenticité d'un tableau,
ni chaîne complète de propriété. Utiliser un vrai validateur conforme
avec vérification de la chaîne de confiance, révocations, binding du
média, puis documenter le fournisseur et la version.

## Ce que contient le code aujourd'hui

`services/access-api/src/artIdentity.mjs` (module pur, non monté HTTP) :

- `hashArtMediaBytesV1` : SHA-256 sur octets du média dans une limite
  mémoire de 64 Mio ; Studio conserve ses propres limites JPG/PNG/WebP/MP4.
- `deriveArtIdV1` : ancre stable dérivée du namespace, du média maître
  et du tirage/édition. Une incohérence ancre/preuve est refusée.
- `compareVisualHash64V1` : distance de Hamming de pHash fournis
  par un pipeline externe à construire, threshold par défaut = 8,
  **aucune reconnaissance calculée ici**.
- `assessArtEvidenceV1` : agrège les déclarations de preuves en
  `human_review_required`, signale divergences, examens incomplets
  et *possible matches*. Même une déclaration `validator_reported_valid`
  reste non vérifiée par ce module.
- `diffArtEvidenceV1` : comparaison déterministe de dossiers pour
  réévaluation, sans conclusion automatique de fraude.

Les données transmises à ce module doivent être considérées **non fiables** :
son appelant serveur doit authentifier les sources, contrôler ACL/tenant et
enregistrer séparément la preuve du vérificateur, avant toute revue publique.

## Métadonnées proposées NFT MultiversX

Version proposée, **pas encore appliquée à un NFT réel** :

```json
{
  "schema": "xartists.art-id.v1",
  "art_id": "xart:v1:<64 hex>",
  "master_media_sha256": "<64 hex>",
  "edition_id": "edition-1",
  "media_uri": "ipfs://<cid>/artwork.jpg",
  "metadata_version": 1,
  "artist_claim": {"signer": "<erd1...>", "proof_ref": "private:dossier-ref"},
  "c2pa": {"status": "not_checked"},
  "verification": {"status": "pending_human_review"},
  "rights": {"physical_title_transferred": false, "copyright_transferred": false},
  "nft_ref": {"network": "multiversx-testnet", "collection": "<ESDT>", "nonce": null},
  "reassessment": {"next_review_at": null}
}
```

Les champs entre chevrons sont des **placeholders**, non des identifiants
existants. En public : éviter de publier les dossiers de propriétaires,
adresses physiques, factures, contrats, résultats de police nominaux,
données privées de collection, ou les preuves confidentielles. Les NFT
sont souvent immuables et les URI peuvent persister après une révocation.

## Pipeline futur d'évaluation et d'alerte

```text
Artist Wallet / Museum / Curator
  -> Studio upload & rights acceptance (existants, gated)
  -> validation MIME + original SHA256 (existant)
  -> xArt-ID namespace-bound (nouveau, pure function)
  -> C2PA/IPTC validation + provenance documents (non connectés)
  -> possible visual duplicate candidates (pHash / embeddings, non connectés)
  -> authorized stolen registry search (non connecté)
  -> independently verified on-chain metadata / transfers (à ajouter)
  -> manual artist/curator/legal approval
  -> private dossier + redacted, time-stamped public attestations (à ajouter)
  -> scheduled differential reassessment, alerts, revoke (à ajouter)
```

Une réévaluation déclenchée par nouvelle transaction, metadata URI changée,
signature révoquée, double inscription, nouveau dossier de vol ou litige
est un **signal pour curateur**, pas un bannissement automatique.

Le schéma SQL proposé `services/access-api/sql/candidate_art_id_provenance.sql`
est **non appliqué** ; il nécessite consentement, isolation multi-tenant,
RLS/ACL, rétention GDPR, journaux d'audit, politique d'appel aux registres
et tests de concurrence avant l'exploitation commerciale.

## Tests d'acceptation prochains

- Comparaisons réelles avec images consenties : originaux, compression,
  recadrage, signatures, contrefaçons imprimées, IA générative.
- Mesurer précision/rappel à seuils par medium, taux de fausses alertes,
  hachage exact, collisions soft hashes, variabilité photo/éclairage.
- Tester une image copiée avec certificat mensonger : **ne pas certifier**.
- Vérifier C2PA valide/invalide/révoqué avec validateur réel.
- Interroger explicitement des registres seulement après contrat/accès.
- Rejouer un NFT « clone » de ticker sur une collection différente : **mismatch**.
- Tester mutation URI/attributs, indexation retardée, reorg/fail API.
- Contrôler les habilitations curatoriales, masquage et circuit de contestation.

Références :
[C2PA 2.2](https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html),
[IPTC 2025.1](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata-2025.1.html),
[INTERPOL](https://www.interpol.int/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database),
[Art Loss Register](https://www.artloss.com/),
[MultiversX NFT](https://docs.multiversx.com/tokens/nft-tokens/).

**NO-GO** commerce, claims NFT mainnet, paiement réel, mint automatique,
trading LIA ou pont TRO. La provenance ne déverrouille aucun rail commercial.
