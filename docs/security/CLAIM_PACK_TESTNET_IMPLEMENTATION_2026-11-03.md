---
description: >-
  Implémentation source isolée de claimPack testnet (non déployée), statut des
  contrôles et matrice de scénario avant toute signature et livraison réelle.
---

# claimPack testnet — prototype Rust et critères de preuve

**Statut : prototype source isolé ; ni déployé ni activé.** L'achat
PayBox, le mint mainnet, LIA et le bridge TRO restent désactivés.

Le code est sous `contracts/claim-pack-testnet/`, et le workflow
`.github/workflows/claim-pack-testnet-compile.yml` vérifie la
compilation Rust 0.66.2 sans secret et sans réseau de destination.
L'ancien contrat `agents-marketplace` n'est pas modifié.

## Contre-mesures présentes dans le code

- `claimPack` vérifie l'appelant, le prix EUR exact, le catalogue,
  le signer actif, la signature Ed25519 des **146 octets**,
  la fenêtre de 900 secondes, l'absence de révocation et l'unicité.
- La livraison tente une création NFT puis un transfert au caller
  **dans la même transaction**, avec réservation de `claimed[hash]`
  avant émission. La réversion réelle de l'état après erreur doit
  être mesurée en VM, pas inférée d'un simple test unitaire.
- Les endpoints owner permettent l'inscription d'un signer par
  epoch immuable, sa désactivation permanente (pause automatique),
  la révocation d'un hash et la pause des claims ; état initial
  **paused=true**.
- `setPackPrice` et l'ancien `buyPack` EGLD sont complètement hors
  du nouveau contrat. Une clé signataire privée n'est jamais stockée
  dans le code.

## Matrice de sécurité testnet — non encore prouvée

| Test obligatoire | Réussite attendue | Preuve à fournir |
| --- | --- | --- |
| 1. Voucher correct | 1 NFT au bon buyer, tx et nonce vérifiés | scénario VM + reçu |
| 2. Mauvais caller | refus, aucun changement de compteur | scénario VM |
| 3. Fenêtre expirée/future | refus avec timestamps bloc contrôlés | scénario VM |
| 4. Signature fausse / epoch incorrect | refus, aucune émission | scénario VM crypto |
| 5. Prix EUR faux / catalogue non v1 | refus | scénario VM |
| 6. `revokeOrderHash` | refus après révocation | scénario VM |
| 7. `pauseClaims` | refus puis reprise uniquement après accord owner | scénario VM |
| 8. Deuxième tentative même hash | refus sans deuxième NFT | scénario VM |
| 9. Role NFTCreate absent | échec tx, `claimed=false` | scénario VM rôle |
| 10. Signer désactivé / rotation | signature ancienne non admise | scénario VM |
| 11. Autre réseau / autre SC | signature invalide sur mauvais contexte | scénario multi-réseau |
| 12. Cross-shard / gas insuffisant | aucun droit créé sans reçu final | scénario VM + ops |

**État des douze scénarios : à exécuter.** Le workflow de parité
Node ↔ Rust déjà présent sur main ne vérifie que le format hors ligne,
et le CI du prototype doit prouver au moins sa compilation.

## Blocage de chaîne d'identité

Le code source actuel incorpore le domaine testnet littéral `T`.
Cela **n'atteste pas que l'EVM/VM exécute réellement sur testnet**.
En particulier une adresse de SC peut théoriquement être réutilisée
sur une autre chaîne. Avant déploiement testnet, implémenter une source
d'identité réseau indépendante et prouver la liaison chain_id + SC
en scénarios multi-réseaux. Un drapeau d'environnement Render ne
constitue pas une preuve on-chain.

Aucun contrat ne doit être déployé, aucune collection NFT ne doit être
modifiée, aucune nouvelle clé ne doit être installée et aucun
voucher de paiement ne doit être émis au seul motif que le code compile.

Références :
[Format B+A](claim-voucher-b-a-2026-11-03.md),
[Spécification initiale](CLAIM_PACK_TESTNET_SPEC_2026-11-03.md),
[API MultiversX](https://docs.multiversx.com/developers/developer-reference/sc-api-functions/).
