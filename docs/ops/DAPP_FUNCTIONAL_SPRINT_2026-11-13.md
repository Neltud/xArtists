# Sprint dApp — parcours vendeur et identité du backend

## Référence avant ce lot

Le 13 novembre 2026 à 10 h 24, heure de Paris, le site public exposait le commit
`be3fa8aa98b6ac4d44ce7ffabd09293ad87133e7` et 133 routes. L'API xOrus renvoyait
un rapport serveur v2 avec six indicateurs, trois familles et zéro attestation
indépendante, en mode paper et ABSTAIN. Le diagnostic Studio renvoyait 503
avec `table_ready=false`, tandis que la table des commandes était disponible.
Ces observations sont datées : les relire avant une action.

## Parcours vendeur

Les tests d'interaction montent les vrais composants React avec un inventaire
de 100 NFT : recherche et lien direct vers le NFT nº75, prix initial vide,
nettoyage du devis au changement d'œuvre et préparation consultable sans signature.
La recette Chromium couvre ces interactions sur mobile et desktop avec un
wallet simulé en lecture seule et des réponses MultiversX interceptées.

Une tentative de listing possède désormais une annulation propagée aux lectures
réseau et au hook de transaction. Fermer la fiche, modifier prix ou cible, changer
de wallet, perdre la capacité de signer ou quitter la page invalide la tentative.
Une réponse tardive ne peut pas solliciter le signataire. Un verrou synchrone
empêche deux demandes concurrentes ; un ancien résultat ne rétablit pas un devis
ni l'état d'une nouvelle session. L'annulation ne retire pas une transaction
déjà remise au wallet ou diffusée.

Le hook relit toujours propriété, contrat, état payable, frais et royalties.
Le test positif utilise un faux signataire ; il ne constitue ni un listing
mainnet réel ni une preuve de vente ou de livraison.

## Identité du processus API

`GET /v1/ops/build-info` et `/health.source_sha` permettent de distinguer le
backend effectivement démarré du commit affiché par GitHub Pages. Render fournit
`RENDER_GIT_COMMIT` ; un déploiement sur un hôte géré par l'opérateur peut fournir
`XARTISTS_SOURCE_SHA`, égal au checkout réellement construit.

Une identité absente, malformée ou contradictoire produit 503 et un SHA nul,
sans fallback vers le SHA de la dApp. `started_at` est une heure de démarrage,
pas une date de build. Le SHA est déclaré par l'hébergeur : il n'est ni une
signature d'image ni une autorisation d'action. Aucune variable privée n'est
retournée ; aucun paramètre HTTP ne peut modifier cette identité.

## Validation et suivi

Vérifier les suites frontend/API, TypeScript et les 133 routes ; attendre la
recette Chromium et les images Render/OVH sur le dernier HEAD. Après publication,
comparer séparément le SHA de Pages et celui de l'API au commit fusionné.

Les comptes email, droits d'analyses privées et abonnements restent suivis dans
[#548](https://github.com/Neltud/xArtists/issues/548). Studio/IPFS exige encore
la preuve de la base cible, une restauration testée, les migrations adéquates
et la lecture d'un vrai CID. Aucune migration ni activation commerciale n'est
effectuée par ce lot. Les flags de paiement, mint et trading restent inchangés.

Retour arrière : revenir au commit précédent. La route d'identité peut alors
disparaître ; ne jamais convertir cette absence en preuve de déploiement.
