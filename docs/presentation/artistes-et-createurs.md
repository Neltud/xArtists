---
description: >-
  Guide pratique et statut réel pour créer sa collection et minter son premier
  NFT depuis xArtists Studio avec son propre wallet MultiversX mainnet.
icon: palette
---

# Artistes et créateurs

**Le Creator Studio V3 est ouvert aux artistes.** Ils peuvent préparer leurs œuvres, demander la création de leur propre collection NFT sur **MultiversX mainnet**, attribuer le rôle de création si nécessaire et signer le mint d'un premier NFT depuis leur wallet personnel. Le parcours a été corrigé dans [la PR #268](https://github.com/Neltud/xArtists/pull/268), fusionnée, testée et déployée le 2 novembre 2026.

[**Ouvrir le Creator Studio**](https://neltud.github.io/xArtists/create/studio/) · [Voir le code du parcours](https://github.com/Neltud/xArtists/blob/main/docs/CREATOR_MAINNET_MINT.md)

> **État de validation :** l'interface et les tests automatisés sont en production. Le premier **mint réellement signé par un artiste et confirmé sur Explorer** reste à documenter. Aucun wallet, aucune clé et aucun achat ne sont utilisés par le support pour effectuer une transaction à la place de l'artiste. Ce flux est distinct des achats de packs Genesis par PayBox, qui restent soumis à leur propre validation.

## Votre première collection et votre premier NFT

{% stepper %}
{% step %}
### Connecter son propre portefeuille

Ouvrez le [Studio xArtists](https://neltud.github.io/xArtists/studio). Utilisez votre wallet artiste **xPortal ou Web Wallet** connecté à MultiversX mainnet. Vous restez propriétaire de votre collection et contrôlez les signatures. Ne communiquez jamais votre seed phrase, PEM ou clé privée.
{% endstep %}

{% step %}
### Émettre une collection NFT

Choisissez un nom de **3 à 20 caractères**, puis un ticker de **3 à 10 caractères A-Z/0-9**. La transaction officielle **`issueNonFungible`** est signée par vous. Le coût d'émission sur MultiversX est de **0,05 EGLD**, auxquels s'ajoutent les frais réseau. Vérifiez les valeurs et le destinataire dans votre wallet avant de signer.

Attendez la réussite sur [MultiversX Explorer](https://explorer.multiversx.com/) ; relevez l'identifiant réel, par exemple `ATELIER-abcdef`. Le ticker seul n'est pas l'identifiant de collection.
{% endstep %}

{% step %}
### Vérifier la propriété et le droit de création

Indiquez le véritable identifiant de collection dans le Studio. L'interface consulte l'API publique MultiversX pour contrôler le propriétaire et le rôle **`ESDTRoleNFTCreate`**. Si le rôle existe déjà sur votre adresse, vous pouvez continuer. Sinon, seul le **propriétaire** de la collection peut demander son attribution via **`setSpecialRole`** et signer la transaction.

Après chaque signature, attendez la confirmation de la blockchain. Un simple envoi de transaction ou un identifiant de session n'est **pas** une preuve de réussite.
{% endstep %}

{% step %}
### Publier l'œuvre et minter

Préparez le titre, la description, les droits et une image ou vidéo dont vous détenez les autorisations. Publiez réellement le média sur **IPFS** ou à une **URL HTTPS durable** et collez l'URI dans le formulaire : un fichier choisi sur votre ordinateur n'est pas téléversé automatiquement.

Vous pouvez ensuite signer **`ESDTNFTCreate`** pour créer un premier NFT unique (quantité 1), avec des royalties Studio de **0 à 10 %**. Le système exige le rôle de création de votre wallet avant l'envoi.
{% endstep %}

{% step %}
### Vérifier votre premier NFT

Vérifiez le statut `success` sur Explorer, le nonce, le nom, le média et la présence du NFT dans **votre portefeuille**. Tant que la transaction reste en attente, ne la renvoyez pas sans vérification : vous risqueriez de créer un doublon.

Le **listing Marketplace**, la certification d'une œuvre physique et les packs Genesis sont des fonctionnalités distinctes avec leurs propres conditions.
{% endstep %}
{% endstepper %}

## Quel dossier préparer ?

| Élément        | À renseigner                                                               |
| -------------- | -------------------------------------------------------------------------- |
| Créateur       | Nom ou signature, et adresse wallet propriétaire                           |
| Œuvre          | Titre, description, support et droits afférents                            |
| Média          | URL IPFS ou HTTPS durable et accessible                                    |
| Collection     | Ticker et véritable identifiant on-chain                                   |
| On-chain       | TX issue, preuve du rôle NFTCreate, TX mint confirmée                      |
| Œuvre physique | Conditions de propriété matérielle, certificat et livraison si applicables |

## Limites, sécurité et disponibilité

* **Mint direct par l'artiste :** chemin frontend mis à disposition, tests de protocole et CI réussis, premier essai mainnet humain **à confirmer**.
* **Pack Genesis Pulse / Yield / Sentinel :** vente unique distincte, livraison après paiement et NFT commerciaux **non homologués** dans ce guide.
* **LIA et trading autonome :** mode paper ; non activé par le parcours créateur.
* **Stockage :** une URI IPFS ou HTTPS doit être publiée séparément ; ni le NFT ni le Studio ne garantissent à eux seuls une conservation perpétuelle du fichier.
* **Droits d'auteur et œuvres physiques :** un NFT ne cède pas automatiquement tous les droits patrimoniaux ni le titre de propriété de l'œuvre physique.

La page [État du produit](etat-du-produit.md) détaille les disponibilités. Les contrats système et le fonctionnement des NFT sont décrits dans la [documentation officielle MultiversX](https://docs.multiversx.com/tokens/nft-tokens/).

## Importer une image ou une vidéo et préparer le mint NFT

Le **Creator Studio V3** permet désormais de sélectionner un fichier **JPG/JPEG, PNG, WebP (jusqu'à 16 Mo) ou MP4 (jusqu'à 48 Mo)** directement dans la dApp, de voir un aperçu, puis de préparer sa publication IPFS avant la création du NFT.

Ce parcours a été intégré par la [PR #273](https://github.com/Neltud/xArtists/pull/273), fusionnée et contrôlée par la CI, avec une [nouvelle Marketplace](https://neltud.github.io/xArtists/marketplace) séparant art numérique, œuvres physiques et packs IA.

### Comment cela fonctionne

1. Ouvrez le [Creator Studio](https://neltud.github.io/xArtists/studio), connectez votre portefeuille xPortal, choisissez ou émettez votre collection NFT.
2. Sélectionnez votre photo ou MP4. Le navigateur en propose un aperçu **local** ; ce n'est ni un upload réussi ni un NFT.
3. Confirmez vos droits de publication et ajoutez un titre et une description. Pour une vidéo, les métadonnées utilisent le champ `animation_url`; pour une image, le champ `image`.
4. Lorsque le service d'upload est activé, signez un challenge dédié. L'API épingle le média et ses métadonnées JSON sur IPFS via un secret Pinata conservé **sur le serveur**, sans clé privée de wallet.
5. Vérifiez les URI `ipfs://...`, le nom de l'œuvre, le rôle `ESDTRoleNFTCreate` et les frais, puis **signez vous-même** `ESDTNFTCreate` dans xPortal.
6. Une transaction sur MultiversX Explorer marquée `success` et un NFT récupérable dans le wallet constituent la preuve du mint, contrairement à un simple CID ou identifiant de session.

> **Disponibilité vérifiée :** le sélecteur et les aperçus sont déployés sur le site. **L'upload automatique n'est pas encore activé côté API** : la dApp affiche le message correspondant. Il faut une configuration Pinata, une base PostgreSQL durable et une validation de recette. En attendant, le Studio accepte toujours une **URI IPFS ou HTTPS déjà publiée** manuellement. Aucun premier mint humain JPG/MP4 abouti n'est attesté par cette mise à jour.

**Vie privée et propriété intellectuelle :** les fichiers publiés sur IPFS peuvent rester accessibles durablement. N'importez pas de médias dont vous ne possédez pas les droits ; ne publiez pas de documents sensibles. Un NFT ne transfère pas par lui-même les droits d'auteur d'une œuvre.

Le [guide technique complet est sur GitHub](https://github.com/Neltud/xArtists/blob/main/docs/CREATOR_MEDIA_UPLOAD_IPFS.md).

### Nouvelle Marketplace et canaux commerciaux

La [Marketplace xArtists](https://neltud.github.io/xArtists/marketplace) sépare désormais :

* **Art numérique** : NFT d'artistes, photo, image, vidéo MP4, avec recherche et tri quand des offres vérifiées sont indexées.
* **Œuvres physiques / RWA** : certificat, suivi logistique Shopify et réception de l'acheteur, quand le service est activé.
* **Packs IA** : Pulse, Yield et Sentinel ; droits d'accès distincts des œuvres.

**Etsy** peut être étudié pour des **œuvres physiques originales éligibles** selon ses règles de créativité, d'expédition et de vendeur. **Etsy interdit la vente et l'achat de NFT**, et une vente Etsy ne doit pas être redirigée vers un paiement xArtists. Aucune annonce Etsy n'a été publiée automatiquement.

Les workflows de code sont vérifiés, mais **la mise en vente contractuelle et les achats réels restent désactivés** lorsque le contrat Marketplace n'a pas son codehash validé. Il ne faut ni créer de faux prix ni confondre catalogue et marché live.

**Qualité technique vérifiée :** les [PR #274](https://github.com/Neltud/xArtists/pull/274), [#275](https://github.com/Neltud/xArtists/pull/275) et [#276](https://github.com/Neltud/xArtists/pull/276) sont fusionnées. Le frontend est passé de **76 à 0 erreur TypeScript** et les tests `npm ci`, `npm run typecheck`, `npm run build`, E2E et sécurité ont réussi en CI. [L'issue #271 est résolue et clôturée](https://github.com/Neltud/xArtists/issues/271). Cela ne signifie pas que l'upload automatique IPFS ni les achats NFT sont activés : les gates Pinata/serveur et smart contract restent indépendants.

## Œuvres physiques et NFT : suivi de livraison (nouveau)

xArtists développe également un module de **provenance phygitale** : il associe les informations d'une œuvre tangible à un dossier de suivi, un SKU Shopify unique et, si l'artiste le souhaite, un NFT MultiversX **vérifiable sur le réseau**.

Ce module a été intégré au code le **2 novembre 2026**, dans la [PR #270](https://github.com/Neltud/xArtists/pull/270), avec des tests API, une interface sur la [page RWA](https://neltud.github.io/xArtists/rwa) et un guide technique dans [GitHub](https://github.com/Neltud/xArtists/blob/main/docs/PHYSICAL_ART_SHOPIFY_FULFILLMENT.md).

> **Important : la vente et la livraison physiques ne sont pas encore ouvertes commercialement.** Le service est désactivé côté API tant que les secrets marchand, les webhooks Shopify et une base PostgreSQL durable ne sont pas configurés et testés. La boutique Shopify est encore en période d'essai. Aucun premier colis, réception d'acheteur ni expertise IA de l'état d'une œuvre n'a été confirmé en production.

### Comment une œuvre physique sera suivie

1. **L'artiste enregistre son œuvre**, une photo originale dont une empreinte cryptographique est calculée, et éventuellement son identifiant NFT. Le fichier photo lui-même reste sous son contrôle ; il doit conserver l'original.
2. **Un marchand publie un produit physique Shopify** avec le SKU donné et le stock correct, après accord sur le prix, l'assurance, le transport et les conditions de vente.
3. **Une commande effectivement payée** est rapprochée du dossier grâce à un webhook Shopify signé. Un panier, un paiement en attente ou une commande remboursée ne valent pas vente confirmée.
4. **Le transporteur indique l'expédition puis la livraison.** Ces événements ne suffisent pas à prouver l'acceptation par l'acheteur.
5. **L'acheteur confirme lui-même sa réception**, après connexion et signature avec son wallet, ou signale un dommage ou une non-réception avec une empreinte de sa photographie.
6. **Une demande de réévaluation** peut déclencher une revue humaine avec historique et preuves ; le premier niveau ne fournit qu'un triage déterministe, sans expertise IA ni estimation de valeur certifiée.

### NFT et propriété : ce qu'il faut savoir

* Un NFT associé peut être contrôlé sur **MultiversX mainnet** pour vérifier la détention du NFT créé par le wallet de l'artiste ; cette vérification ne prouve pas, à elle seule, le titre de propriété de l'œuvre tangible.
* Une livraison indiquée comme terminée par un transporteur n'est pas une réception acceptée par l'acheteur.
* Un NFT, une réception ou une proposition d'IA **ne transfèrent jamais automatiquement des droits légaux, des fonds ou un escrow**.
* Les médias privés et les adresses des acheteurs ne sont pas publiés dans le registre public ; leur traitement, leur conservation et les consentements devront être revus avant ouverture commerciale.

Les artistes peuvent continuer à [préparer leur NFT dans le Studio](https://neltud.github.io/xArtists/studio) ; l'activation commerciale et le suivi de colis réel resteront annoncés séparément, après validation.

## Pour aller plus loin

[Présentation xArtists](./) · [Démarrer](demarrer-sur-mobile.md) · [Disponibilité](etat-du-produit.md) · [Contribuer et partenariats](contribuer-et-partenariats.md)
