# $TRO — TUDURIORIGINAL

**Réseau :** MultiversX mainnet  
**Identifiant ESDT :** `TRO-94c925`  
**Nom :** TUDURIORIGINAL · **Ticker :** TRO  
**Site :** [welcome.xartists.art](https://welcome.xartists.art/)  
**Explorer :** [TRO-94c925](https://explorer.multiversx.com/tokens/TRO-94c925)  
**API :** `https://api.multiversx.com/tokens/TRO-94c925`

---

## 1. À quoi sert $TRO

$TRO est le **token d’utilité / culture** de l’écosystème **xArtists** :

| Usage | Description |
|-------|-------------|
| Identité artistique | Token conçu pour les NFT artistiques et œuvres **physiques / phygital** |
| DAO (lecture → vote futur) | Staking / gouvernance via SC `tro_governance` (UI vote volontairement limitée tant que non branchée) |
| Incentives créateurs | Rewards (ex. jusqu’à **1 TRO** max par NFT œuvre réelle — policy produit) |
| Liquidité / swap | Paires type TRO/WEGLD (OneDex, etc.) — **faible liquidité** |
| Burn (prévu) | Mécanisme déflationnaire sur ventes (voir §5) — **pas entièrement on-chain** à ce jour |

**Ce que $TRO n’est pas :**

- Pas une part de fonds d’investissement  
- Pas une promesse de yield LIA  
- Pas un cash équivalent pour la treasury (illiquide)

Voir aussi : [`TREASURY_POLICY.md`](TREASURY_POLICY.md) · [`ORACLES.md`](ORACLES.md).

---

## 2. Paramètres on-chain (référence)

| Champ | Valeur |
|-------|--------|
| Token ID | `TRO-94c925` |
| Decimals | **6** (source API MultiversX) |
| Supply affiché API | ≈ **476 224** TRO (circulant ≈ même ordre) |
| **Plafond produit xArtists** | **500 000 TRO** max (sauf vote DAO documenté) |
| Comptes holders (ordre API) | ~574 |
| `canMint` | true (owner token manager) |
| Prix indexeur | souvent **≈ 0** ou très bas (illiquide) |

> Les chiffres `supply` / `burnt` de l’API évoluent. Toujours recouper l’explorer avant communication publique.

**Owner token (manager, ≠ wallet LIA ops) :**  
`erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l`

**Wallet protocole LIA (ops, pas owner mint) :**  
`erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

---

## 3. Policy LIA vis-à-vis de $TRO

Source machine : `data/lia_tro_policy.json`.

**Règle :** LIA **accumule** EGLD / WEGLD / USDC / WBTC-type pour l’ops et la mission.  
Tout **TRO récupéré** par LIA est **redistribué** (pas thésaurisé comme cash).

| Destination (bps) | % | Rôle |
|-------------------|---|------|
| Pool | 4000 | 40 % — liquidité / pool |
| Stake | 3000 | 30 % — staking / gouvernance |
| Rewards | 2000 | 20 % — incentives |
| Burn | 1000 | 10 % — destruction |

- **Pool (réf. config) :** `erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc`  
- **Stake / gov (réf.) :** `erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8`  
- **Burn sink (convention) :** adresse dead `erd1dead…deaqtvj5r6`

Trigger Vellum : nœud `tro_redistributor` si balance TRO détectée (seuil `min_atomic`).

---

## 4. Rôle dans la dApp

| Page / module | Comportement |
|---------------|--------------|
| Dashboard | Affiche balance TRO **wallet LIA** (ops) |
| /tro | Fiche token, liens swap / explorer |
| /dao | Stats / stake UI — vote on-chain **non garanti** sans sdk-dapp + policy |
| /marketplace | Paiement possible en TRO listé dans config — fees market = SC live only |
| Oracles | `TRO-USD` via indexeur — **display only**, pas mark cash treasury |
| Studio / rewards | Incentives créateurs physiques plafonnés (ex. 1 TRO / NFT réel) |

**Supply max communication produit :** toujours **500 000** dans l’UI et le footer.

---

## 5. Burn & tokenomics produit

| Mécanisme | Statut |
|-----------|--------|
| Cap 500 000 | Policy produit (pas élargi sans vote) |
| Redistribution LIA 40/30/20/10 | Policy ops (`lia_tro_policy.json`) |
| Burn sur sale NFT (`tro_burn_bps` = 100 → 1 %) | **Documenté** dans `config.json` — **pas encore on-chain** sur le marketplace non déployé |
| Burn via sink dead | Possible manuellement / script redistributor |

Tant que le SC marketplace n’a pas `codeHash` live, **aucun burn automatique sur buyNft**.

---

## 6. Liquidité & risque

| Risque | Mitigation |
|--------|------------|
| Illiquidité / prix ≈ 0 indexeur | Ne pas valoriser la treasury en $TRO comme cash |
| Confusion « investissez pour le yield LIA » | Copy : utility + culture, pas share de fonds |
| Owner mint ≠ LIA ops | Séparer rôles ; pas de mint autonome par Vellum |
| Double comptage paper / live | `LIA_LIVE_TRADING=0` jusqu’à micro-proof |

Swap de référence (config) : pair **TRO/EGLD** OneDex — liens dans `data/config.json`.

---

## 7. Liens utiles

| Ressource | URL |
|-----------|-----|
| Explorer token | https://explorer.multiversx.com/tokens/TRO-94c925 |
| API token | https://api.multiversx.com/tokens/TRO-94c925 |
| Site | https://welcome.xartists.art/ |
| Twitter (assets) | https://twitter.com/tudurioriginal |
| Icon CDN | https://tools.multiversx.com/assets-cdn/tokens/TRO-94c925/icon.png |

---

## 8. Fichiers repo liés

| Fichier | Contenu |
|---------|---------|
| `data/config.json` | tro_token, supply snapshot, commissions, pools |
| `data/lia_tro_policy.json` | Split redistrib LIA |
| `data/oracle_config.json` | Paire TRO-USD |
| `data/contracts.json` | tro_governance address |
| `docs/TREASURY_POLICY.md` | $TRO ≠ parts de fonds |
| `docs/ORACLES.md` | Prix indexeur |

---

## 9. Synthèse

**$TRO** = token culturel / utilitaire xArtists sur MultiversX, **cap produit 500 000**, liquidité limitée, **LIA ne le thésaurise pas** (redistribution + burn policy).  
La crédibilité vient de l’**usage** (NFT, DAO, incentives) et de la **transparence on-chain**, pas d’une promesse de performance.

*Document produit — chiffres on-chain à revalider sur l’explorer avant annonces publiques.*
