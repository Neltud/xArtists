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
compilation Rust 0.66.2 **et exécute des scénarios whitebox VM** sans secret et sans réseau de destination.
L'ancien contrat `agents-marketplace` n'est pas modifié.

## Contre-mesures présentes dans le code

- `claimPack` vérifie l'appelant, le prix EUR exact, le catalogue,
  le signer actif, la signature Ed25519 des **146 octets**,
  la fenêtre de 900 secondes, l'absence de révocation et l'unicité.
- La livraison tente une création NFT puis un transfert au caller
  **dans la même transaction**, avec réservation de `claimed[hash]`
  avant émission. La réversion lorsque le rôle NFTCreate manque est
  **vérifiée par le test de scénario whitebox de la VM**, mais pas encore
  par une transaction testnet publique.
- Les endpoints owner permettent l'inscription d'un signer par
  epoch immuable, sa désactivation permanente (pause automatique),
  la révocation d'un hash et la pause des claims ; état initial
  **paused=true**.
- `setPackPrice` et l'ancien `buyPack` EGLD sont complètement hors
  du nouveau contrat. Une clé signataire privée n'est jamais stockée
  dans le code.

## Matrice de scénarios — VM locale passée, testnet public non exécuté

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
| 10. Signer désactivé / rotation | auto-pause vérifiée ; rotation complète à tester | scénario VM partiel |
| 11. Autre réseau / autre SC | mauvais SC refusé en VM ; autre réseau non testé | scénario VM partiel |
| 12. Cross-shard / gas insuffisant | aucun droit créé sans reçu final | **à faire en testnet** |

**État mesuré : 12/12 tests whitebox VM passés** dans la CI
`Claim Pack V1 — isolated SC compile (NO DEPLOY)` (incluant refus
cryptographique, anti-rejeu, contrôle d'autorisation administrateur,
lien avec l'adresse de contrat et rollback en cas d'absence de rôle
`NftCreate`). Ce total de 12 correspond aux fonctions de test Rust
effectivement exécutées, **pas** à la validation des douze lignes de la
matrice sur le testnet public.

Les points **non couverts** restent l'identité réelle de chaîne,
les reçus et la finalité sur réseau public, le fonctionnement cross-shard,
le gas insuffisant, le déploiement WASM, la signature de vouchers
sur un serveur authentifié et les garanties S1/S2 SQL. Ne pas confondre
les tests `whitebox_legacy` (où le contrat est invoqué dans une VM
simulée) avec des preuves on-chain. Le workflow de parité
Node ↔ Rust sur main valide séparément les octets du protocole.

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


## Résultats des tests `claim_pack_vm.rs` (locaux)

Le runner utilise uniquement la bibliothèque `multiversx-sc-scenario
0.66.2`, une clé Ed25519 **synthétique de test**, un bloc à timestamp
contrôlé et une collection fictive `XCLM-abcdef`. Test du NFT créé et
du solde acheteur : **OK**. Un autre acheteur muni de la même signature,
une signature falsifiée et une signature liée à une autre adresse de SC
échouent avec l'erreur cryptographique native de la VM.
Un vendeur ou visiteur non owner ne peut pas appeler les méthodes de
gouvernance, car chaque méthode valide elle-même le propriétaire
**en complément** de l'attribut `#[only_owner]`.

La VM génère des exceptions internes attendues pour simuler les
reverts ; elles n'indiquent pas des tests échoués lorsque le rapport
final est `12 passed; 0 failed`.

**GO** uniquement pour poursuivre la revue de code et le design de
déploiement testnet. **NO-GO** pour déployer une instance sur réseau
testnet sans revue du chain-ID et des rôles, et **NO-GO** sur le
mainnet commercial.
