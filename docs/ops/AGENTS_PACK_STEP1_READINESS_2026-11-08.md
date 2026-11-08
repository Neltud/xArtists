# Étape 1 — Agents packs mainnet readiness (2026-11-08)

**Statut : PREP ONLY · aucune tx broadcast · commerce toujours NO-GO**

SC : `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg`  
Owner : `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`  
codeHash live : `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`

## 1. Contract metadata — clarification officielle

| Flag compte SC | Valeur observée le 8 novembre |
|----------------|------------------------------|
| `isPayable` | **false** |
| `isPayableBySmartContract` | **false** |
| `isUpgradeable` | true |

**Correction importante :** selon la documentation officielle MultiversX,
`isPayable=false` empêche les **transferts directs** au contrat, mais **n'empêche pas en soi un paiement EGLD à un endpoint** déclaré `#[payable("EGLD")]`.
Voir https://docs.multiversx.com/developers/developer-reference/sc-payments/ .

**Ne pas effectuer d'upgrade payable avec le même WASM comme prérequis obligatoire.**
L'acceptation effective de `buyPack` reste à prouver par une simulation ou micro-opération owner **après** validation du modèle NFT/IPFS. Changer le metadata payable élargirait les possibilités de transfert direct sans réparer les NFT sans URI.

### Action owner (seulement après préparation IPFS et revue)

1. Vérifier le même codeHash, l'endpoint `buyPack`, son ABI, les valeurs exactes retournées par `getPackPrice` et la politique de sécurité.
2. Corriger la création des NFT pour utiliser des URI IPFS non vides, via une évolution contractuelle auditée, ou prouver un processus de réparation des nonces sous rôles appropriés.
3. Re-probe après changement, puis seulement envisager un micro-test signé par le wallet owner.
4. Garder toutes les ventes publiques suspendues tant que le média, la livraison, les droits et le prix ne sont pas prouvés.

> Ce dépôt **ne signe pas** et **ne diffuse pas** de transaction.

## 2. Prix on-chain (VM query `getPackPrice`) — vérité

| pack_type | Nom | Collection | Prix on-chain | Doc historique (souvent citée) | Catalogue fiat API |
|-----------|-----|------------|---------------|--------------------------------|--------------------|
| 1 | Pulse | `XAIPLS-2cf72b` | **1.0 EGLD** | 10 EGLD (erroné) | 110 EUR |
| 2 | Yield | `XAIYLD-987e24` | **5.0 EGLD** | 5 EGLD | 75 EUR |
| 3 | Sentinel | `XAISNT-3d8a6b` | **2.5 EGLD** | 2.5 EGLD | 50 EUR |

`isPaused` → false (SC non en pause).  
`getOwner` → owner LIA ops ci-dessus.

**Écart prix :** la doc “Pulse 10 EGLD” est **fausse** vs chaîne (1 EGLD). Toute UI qui affiche 10 EGLD doit être corrigée **avant** commerce.

Endpoint owner pour ajuster si besoin (après revue séparée) : `setPackPrice(pack_type, price_atomic)` — **ne pas appeler** depuis ce canal.

## 3. Collections & rôles

| Collection | NFT indexés | Rôle SC `ESDTRoleNFTCreate` | `canAddUri` / update attrs |
|------------|-------------|-----------------------------|----------------------------|
| XAIPLS-2cf72b | 4 (#1–#4) | oui | **non** |
| XAIYLD-987e24 | 1 | oui | **non** |
| XAISNT-3d8a6b | (configurée) | (à re-vérifier avant vente) | **non** |

`buyPack` crée des NFT avec **`uris` vide** (code actuel). Même si les appels au endpoint `buyPack` acceptent l'EGLD, les nouveaux packs sortent **sans média** — inacceptable pour une vente grand public.

### Avant vente réelle

1. Attribuer rôles URI/metadata **si** réparation des nonces existants est requise (`ESDTRoleSetNewURI` / `ESDTRoleNFTUpdate`) — 1 tx `setSpecialRole` **par collection**, signée owner token.  
2. Ou déployer/upgrade `buyPack` pour passer des URI IPFS non vides (changement de code → nouveau codeHash, revue séparée).  
3. Pin IPFS + readback 2 gateways **avant** toute annonce.

## 4. Critères GO pack EGLD (tous obligatoires)

- [ ] `buyPack` et son paiement EGLD évalués selon la règle **endpoint payable**, indépendamment du flag de transfert direct `isPayable`
- [ ] UI / docs affichent **1 / 5 / 2.5 EGLD** (ou nouveaux prix après `setPackPrice` on-chain)
- [ ] Médias non vides pour tout nonce vendable (create-time URI ou réparation)
- [ ] Test micro-montant documenté (owner) + readback explorer
- [ ] Backend `mint_live` / checkout fiat restent **indépendants** — ne pas les allumer sur la base du seul codeHash ou du flag payable
- [ ] LIA live trading reste **OFF**

## 5. Explicit non-actions (cette étape)

- Pas de broadcast payable / upgrade
- Pas de `buyPack` réel
- Pas de `setPackPrice` / `setPaused`
- Pas d’ouverture Paybox/Stripe
- Pas de merge #407 / #430 comme live

## 6. Prochaine étape

D'abord médias/IPFS/URI et audit des prix, puis re-probe du contrat et un micro-achat owner sous contrôle, sans commande publique. Le flag `isPayable` n'est pas un seuil d'ouverture du `buyPack`.
