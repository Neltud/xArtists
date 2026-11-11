# Statut réel des fonctionnalités

**Mise à jour : 11 novembre 2026 · Informations de disponibilité, pas une promesse de paiement.**

[**Ouvrir xArtists**](https://xartists.art) · [**Musée**](https://xartists.art/explore/museum) · [**Marketplace**](https://xartists.art/explore/market) · [**Laboratoire**](https://xartists.art/lab) · [**Source / preuves**](https://github.com/Neltud/xArtists)

| Parcours                               | État constaté / limites                                                                                                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation, création, visite           | Consultation publique sans wallet                                                                                                                                                                                                                                |
| Musée immersif                         | Visite WebGL et bouton « Écran vide ? Afficher le musée en mode compatible ». Le mode compatible affiche des œuvres sans WebGL. La compatibilité sur chaque Android reste à tester physiquement                                                                  |
| Connexion xPortal                      | QR/lien et adresse `erd1…` confirmés lors d'un smoke **physique Chrome Android** par le propriétaire après allowlist Reown. Test d'annulation tardive encore à faire                                                                                             |
| Marketplace NFT MultiversX             | Contrat mainnet réel conservé ; **pilote limité à l'annonce #2** `ASFT-a6273a-01`, prix on-chain observé 0,25 EGLD. Le contrat, l'annonce active, le prix et le dépôt sont revérifiés avant toute tentative. Les autres ventes ne sont pas déclarées ouvertes    |
| Achat et livraison du pilote           | L'acheteur distinct du vendeur décide de signer dans son wallet. Un statut « soumis » n'est pas une vente confirmée : rapprochement transaction `buyNft` réussie et NFT présent chez le buyer requis. **Aucun nouvel achat utilisateur confirmé dans ce relevé** |
| Laboratoire                            | Nouvelle route `/lab` / `/intelligence/lab` regroupant simulations et réseau d'agents ; les simulations ne sont pas des transactions mainnet. Fonctionnalité fusionnée dans le code, disponibilité publique à vérifier sur le SHA servi                          |
| Creator Studio, distributeur, IPFS     | Préparation, revue des droits, inventaire et édition de métadonnées ; upload/pinning/mint publics non certifiés à ce stade. Une œuvre Drive n'est pas un NFT minté                                                                                               |
| Comptes sans wallet                    | Fondations backend avec vérification de JWT Neon Auth, **sandbox uniquement** ; inscription/connexion production et liaison wallet non ouvertes. La vérification email est exigée dans la sandbox, sans affirmer un parcours client certifié                     |
| Services, abonnements EUR              | Candidats Stripe sandbox ; **aucun checkout public ni entitlement payant activé**                                                                                                                                                                                |
| Packs Genesis, PayBox, RWA et enchères | Non autorisés à la commercialisation publique faute de preuve de paiement, livraison et règlement réconciliés                                                                                                                                                    |
| LIA, $TRO et multichaîne               | Analyse/simulation ; **trading LIA live désactivé**, pas de bridge ou swap autonome                                                                                                                                                                              |
| Contact xArtists                       | DNS du domaine analysé, mais envoi/réception des boîtes `@xartists.art` non prouvés ; ne pas inventer d'adresse de contact opérationnelle                                                                                                                        |

## Pourquoi les achats ne sont-ils pas tous ouverts ?

La présence d'un contrat sur MultiversX, une interface qui montre un prix ou une requête de wallet ne constitue **pas** une preuve de livraison. Les transactions financières exigent un montant atomique exact, le bon contrat, le bon wallet, un consentement du signataire et des preuves de résultat. Les statuts par produit doivent être indépendants.

Le pilote BlackArtPass à 0,25 EGLD n'active pas les achats de packs, les locations RWA, le trading LIA ou les abonnements.

## Références de développement

* [Marketplace : achat pilote signé par l'utilisateur (#502)](https://github.com/Neltud/xArtists/pull/502)
* [Connexion xPortal Android : relais et annulation (#503)](https://github.com/Neltud/xArtists/pull/503)
* [Musée 3D : secours compatible (#508)](https://github.com/Neltud/xArtists/pull/508)
* [Marketplace : reçu acheteur, frais et statuts (#509)](https://github.com/Neltud/xArtists/pull/509)
* [Inventaire du contrat mainnet en lecture seule (#501)](https://github.com/Neltud/xArtists/pull/501)
* [Comptes Neon JWT vérifié, préparation (#480)](https://github.com/Neltud/xArtists/pull/480)

_Historique :_ [_release du 8 novembre_](../RELEASE_2026-11-08_PUBLIC.md)_. Les anciens prix ou flags de cette archive ne constituent pas une offre commerciale actuelle._

[**Guide web, mobile et xPortal**](demarrer-sur-mobile.md) · [**Prix, droits et livraison**](../security/pricing-delivery.md)
