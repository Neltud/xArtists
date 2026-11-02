# $TRO — pont MultiversX ↔ Solana : architecture et conditions GO/NO-GO

**2 novembre 2026 : bridge NO-GO, vente directe NO-GO.** La page publique /tro/sale est un portail d'information et de vérification, pas un bridge de dépôts ni un checkout actif.

## 1. Identité et source de vérité

Le jeton d'origine *configuré dans xArtists* est **TRO-94c925** sur MultiversX : [vérifier sur Explorer](https://explorer.multiversx.com/tokens/TRO-94c925). Les informations affichées dans le code ne prouvent pas à elles seules que l'émetteur, la quantité en circulation, les décimales et les droits de mint/burn correspondent au token que les gouvernants souhaitent bridger. Ces éléments doivent être vérifiés et approuvés indépendamment avant toute opération.

**Mint SPL Solana officiel : non attesté.** Aucune adresse Solana ne doit être inventée ou publiée comme officielle, aucun nouveau token vendu ou distribué avant la validation des autorités et la couverture économique du jeton.

## 2. Étudier puis choisir une architecture de bridge

Le bridge officiel MultiversX documente des schémas MultiversX ↔ chaînes EVM, mais il n'est pas établi ici qu'il supporte un itinéraire natif MultiversX ↔ Solana pour TRO. Wormhole NTT supporte Solana ; sa liste publique de réseaux ne permet pas d'en déduire la prise en charge de MultiversX. Les deux chaînes doivent être couvertes par une implémentation auditée et adaptée.

- **Lock-and-mint / burn-and-unlock :** les TRO sont immobilisés sur MultiversX. Un mint SPL strictement conditionné par une preuve de finalité donne accès à des unités représentatives sur Solana. Au retour, ces unités sont brûlées avant libération des TRO natifs. Aucun backend Web2 seul ne peut créer de supply.
- **Bridge de liquidité :** les liquidités sont prépositionnées sur les deux chaînes et les inventaires réconciliés après chaque transfert. Nécessite la preuve de la propriété et de la provenance du jeton représentatif sur Solana, un contrôle des comptes et des limites explicites.

**Décision documentée requise :** opérateur et auditor du bridge, autorité légitime TRO, participants multisig, choix du bridge, plafonds, tarifs, gestion des incidents, chaîne d'origine et identification des jetons.

## 3. Invariants de sécurité

1. **Conservation :** unités TRO représentées en circulation sur Solana ≤ réserves TRO verrouillées sur MultiversX, après conversion entière exacte des décimales.
2. **Anti-rejeu :** combinaison chaîne source + tx hash + index d'événement + chaîne cible identifiant chaque mouvement une seule fois ; statut conservé dans un ledger durable, idempotent.
3. **Finalité :** aucun mint ni déblocage ne peut suivre un simple événement non finalisé. États : observed → finalized → attested → executed ; toute divergence, erreur RPC, reorg ou attente anormale → HALT.
4. **Signatures :** émission, mise à jour d'autorité, transfert et opérations d'escrow validés par multisig hardware. Ni GitHub, navigateur, serveur API ni IA ne détiennent les clés privées des utilisateurs.
5. **Fiabilité :** tests des doubles dépôts, retries, messages signés falsifiés, chain IDs incorrects, montants négatifs/overflow/dust, panne du validateur et erreurs de décimales.
6. **Transparence :** adresses et code hashes publiés et vérifiés sur les deux explorers ; attestations indépendantes de réserve, opérateurs, statut des audits, procédure d'arrêt d'urgence et restitution.

## 4. Page de vente et réglementation

La page publique peut orienter vers le token MultiversX et vers une **plateforme tierce** de swap documentée dans le dépôt ; le routage externe ne constitue pas une preuve de liquidité ni une cotation garantie. Aucun prix, contrepartie ou wallet de paiement n'est publié ici. Aucun échange ne se déclenche automatiquement.

Avant d'envisager une vente primaire ou l'ouverture d'un checkout, évaluer le règlement **MiCA** et les obligations applicables en France/UE : qualifications exactes du token et de l'opérateur, éventuelles exemptions, livre blanc, notifications, communications marketing non trompeuses, statut de service crypto, KYC et exigences de conformité, conditions de vente et protection des utilisateurs. Cette analyse nécessite un conseil juridique adapté aux faits. **Shopify/Etsy et les produits physiques sont un circuit distinct**, pas un moyen d'esquiver les obligations crypto.

Sources publiques :
- [AMF — MiCA](https://www.amf-france.org/fr/actualites-publications/dossiers-thematiques/mica)
- [ESMA — article 4](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-4-offers-public-crypto-assets-other)
- [ESMA — article 7](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-7-marketing-communications)
- [Wormhole NTT — réseaux supportés](https://wormhole.com/docs/products/token-transfers/native-token-transfers/reference/supported-networks/)
- [Solana — token mint et autorités](https://solana.com/docs/tokens)
- [MultiversX — modèles de bridge](https://docs.multiversx.com/bridge/token-types/)

## 5. État de livraison et critères GO

| Composant | État dans ce sprint |
| --- | --- |
| Interface responsive /tro/sale, /buy-tro, /tro/bridge | Codée sur branche ; ne devient publique qu'après validation/merge/déploiement |
| API GET /v1/tro/bridge/status | Read-only, statut disabled, pas d'adresse SPL |
| API de dépôt, quote de bridge et swap direct | Inexistantes, intentionnellement 404 |
| Mint SPL Solana ou escrow natif | Non déployé, non signé |
| Preuves de couverture, de finalité, anti-rejeu, testnet et audit externe | Non obtenues |
| Conformité vente primaire et marketing | À statuer avant tout checkout |

**GO** seulement après une preuve juridique et technique écrite, tests en devnet/testnet, audit externe, monitoring de supply, validation des autorités, publication des adresses vérifiées et opérations pilotes de très petit montant explicitement signées et approuvées. Aucun simple flag de configuration ne pourra ouvrir le bridge.
