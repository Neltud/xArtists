# Étape 1 — Agents packs mainnet readiness (2026-11-08)

**Statut : PREP ONLY · aucune tx broadcast · commerce toujours NO-GO**

SC : `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg`  
Owner : `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`  
codeHash live : `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`

## 1. Blocage protocole (critique)

| Flag compte SC | Valeur live |
|----------------|-------------|
| `isPayable` | **false** |
| `isPayableBySmartContract` | **false** |
| `isUpgradeable` | true |

`buyPack` est `#[payable("EGLD")]` dans le code, mais le **compte** refuse l’EGLD tant que `isPayable` est false.  
→ **Aucun achat pack EGLD possible** avant correction owner-signed.

### Action owner (hors de ce canal)

Changer les code-metadata du contrat **sans changer le bytecode** (même codeHash), en activant **Payable** (et idéalement garder Upgradeable + Readable) :

1. Wallet owner uniquement.
2. Transaction d’**upgrade** MultiversX avec le **même WASM** déjà déployé et metadata :
   - Upgradeable = true
   - Readable = true
   - **Payable = true**
   - PayableBySC = selon politique (recommandation : false tant que non requis)
3. Après inclusion : re-lire `accounts/{sc}` → `isPayable` doit être `true`.
4. Ne pas ouvrir l’UI d’achat tant que le point 3 n’est pas prouvé + section 4.

> Ce dépôt **ne signe pas** et **ne diffuse pas** cette transaction.

## 2. Prix on-chain (VM query `getPackPrice`) — vérité

| pack_type | Nom | Collection | Prix on-chain | Doc historique (souvent citée) | Catalogue fiat API |
|-----------|-----|------------|---------------|--------------------------------|--------------------|
| 1 | Pulse | `XAIPLS-2cf72b` | **1.0 EGLD** | 10 EGLD (erroné) | 110 EUR |
| 2 | Yield | `XAIYLD-987e24` | **5.0 EGLD** | 5 EGLD | 75 EUR |
| 3 | Sentinel | `XAISNT-3d8a6b` | **2.5 EGLD** | 2.5 EGLD | 50 EUR |

`isPaused` → false (SC non en pause).  
`getOwner` → owner LIA ops ci-dessus.

**Écart prix :** la doc “Pulse 10 EGLD” est **fausse** vs chaîne (1 EGLD). Toute UI qui affiche 10 EGLD doit être corrigée **avant** commerce.

Endpoint owner pour ajuster si besoin (après payable) : `setPackPrice(pack_type, price_atomic)` — **ne pas appeler** depuis ce canal.

## 3. Collections & rôles

| Collection | NFT indexés | Rôle SC `ESDTRoleNFTCreate` | `canAddUri` / update attrs |
|------------|-------------|-----------------------------|----------------------------|
| XAIPLS-2cf72b | 4 (#1–#4) | oui | **non** |
| XAIYLD-987e24 | 1 | oui | **non** |
| XAISNT-3d8a6b | (configurée) | (à re-vérifier avant vente) | **non** |

`buyPack` crée des NFT avec **`uris` vide** (code actuel). Même avec payable=true, les nouveaux packs sortent **sans média** — inacceptable pour une vente grand public.

### Avant vente réelle

1. Attribuer rôles URI/metadata **si** réparation des nonces existants est requise (`ESDTRoleSetNewURI` / `ESDTRoleNFTUpdate`) — 1 tx `setSpecialRole` **par collection**, signée owner token.  
2. Ou déployer/upgrade `buyPack` pour passer des URI IPFS non vides (changement de code → nouveau codeHash, revue séparée).  
3. Pin IPFS + readback 2 gateways **avant** toute annonce.

## 4. Critères GO pack EGLD (tous obligatoires)

- [ ] `isPayable === true` prouvé sur l’API accounts
- [ ] UI / docs affichent **1 / 5 / 2.5 EGLD** (ou nouveaux prix après `setPackPrice` on-chain)
- [ ] Médias non vides pour tout nonce vendable (create-time URI ou réparation)
- [ ] Test micro-montant documenté (owner) + readback explorer
- [ ] Backend `mint_live` / checkout fiat restent **indépendants** — ne pas les allumer “parce que payable”
- [ ] LIA live trading reste **OFF**

## 5. Explicit non-actions (cette étape)

- Pas de broadcast payable / upgrade
- Pas de `buyPack` réel
- Pas de `setPackPrice` / `setPaused`
- Pas d’ouverture Paybox/Stripe
- Pas de merge #407 / #430 comme live

## 6. Prochaine étape après owner payable

Re-probe accounts → mettre à jour `contracts.json` `flags_live.agents_marketplace.isPayable` → puis seulement parcours média / micro-achat owner.
