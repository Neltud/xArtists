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

## Pour aller plus loin

[Présentation xArtists](./) · [Démarrer](demarrer-sur-mobile.md) · [Disponibilité](etat-du-produit.md) · [Contribuer et partenariats](contribuer-et-partenariats.md)
