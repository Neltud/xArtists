---
description: >-
  Disponibilité vérifiée le 2 novembre 2026 — site V3 public et mainnet séparé
  du GO commercial.
icon: circle-check
---

# Accès et disponibilité

**Référence : 2 novembre 2026.** Cette page distingue la disponibilité d'un site web, l'existence de contrats déployés, la lecture de données et l'autorisation de traitements commerciaux ou financiers.

## Adresses officielles

| Destination          | Lien                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Site et dApp publics | [neltud.github.io/xArtists](https://neltud.github.io/xArtists/)                                   |
| Musée                | [Immersive Museum](https://neltud.github.io/xArtists/museum)                                      |
| LIA et agents        | [LIA](https://neltud.github.io/xArtists/lia) · [Agents](https://neltud.github.io/xArtists/agents) |
| Guide public         | [GitBook xArtists](https://xartists.gitbook.io/xartists/)                                         |
| Code et historique   | [Neltud/xArtists](https://github.com/Neltud/xArtists)                                             |

## État réel par capacité

| Domaine                         | État au 2 novembre                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site web / dApp V3              | **En ligne** sur GitHub Pages, dernière publication CI vérifiée                                                                                                         |
| Navigation publique             | Accessible sans wallet ; musée, pages agents, LIA, marketplace de consultation                                                                                          |
| UX mobile                       | PR [#262](https://github.com/Neltud/xArtists/pull/262) fusionnée, Control Room 2D et 3D facultative ; revue mobile matérielle et enregistrements complémentaires prévus |
| LIA                             | **Paper / shadow** par défaut ; l'automatisation du trading LIA Ops n'est pas autorisée                                                                                 |
| Contrats sur MultiversX mainnet | Certains composants sont déployés ; leur existence ne prouve pas la disponibilité de chaque fonction d'achat ou de mint                                                 |
| Packs Genesis                   | Catalogue **110 / 75 / 50 €** ; achat unique, droits durables associés aux SFT ; état de checkout et livraison à vérifier avant encaissement public                     |
| Whop TCA                        | Abonnement **distinct**, services sans SFT Genesis ; disponibilité selon le plan réellement publié                                                                      |
| PayBox                          | Tests automatisés sandbox disponibles ; **aucune preuve de bout en bout d'un encaissement réel + IPN + attribution + remboursement** validée ici                        |
| xPortal                         | Une interface de connexion existe ; test matériel et état des intégrations externes restent à prouver                                                                   |
| Application native              | Aucune publication App Store/Google Play attestée                                                                                                                       |

Les montants EGLD doivent provenir d'un devis serveur valide ou du contrat effectivement interrogé ; les équivalences indicatives d'une carte produit ne sont pas des offres irrévocables.

## À propos des confirmations

Les tests de la PR #262 (Rust, Playwright, audit de sécurité automatisé et fixtures PayBox) et le déploiement GitHub Pages ont réussi. **Cela ne valide ni l'autorisation d'exécuter un ordre autonome, ni un paiement réel, ni un remboursement.**

Le GO marchand requiert au minimum : identité de l'acheteur, devis et montant fiables, preuve PSP signée, liaison d'une seule commande à une seule livraison, état serveur vérifié, contrôle d'idempotence, remboursement et procédure d'arrêt. Pour le trading, un GO distinct est nécessaire.

## Pour les visiteurs

Commencez sans portefeuille ; choisissez une œuvre ou un agent, puis consultez l'état de la fonction voulue. Ne transmettez jamais de phrase de récupération ou de clé privée. Les signaux LIA sont informatifs et ne constituent ni des conseils financiers ni des rendements garantis.

[Présentation](./) · [Guide mobile](demarrer-sur-mobile.md) · [Sécurité](../security/launch-gates.md)
