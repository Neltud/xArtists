# Décisions $TRO rewards — logique dApp / TX

Chaque choix maximise **anti-spam**, **alignement cashflow marketplace**, et **symbiose LIA** (phygital d’abord).

---

## 1. Qui est le « creator » on-chain ?

**Décision : `issuer` / owner de collection (adresse on-chain qui a `issueNonFungible` / détient les rôles ESDT), avec fallback minter du 1er NFT.**

| Option | Verdict |
|--------|---------|
| Minter de chaque NFT | ❌ Un minter délégué ≠ créateur économique |
| Owner / issuer collection | ✅ Identité stable, alignée MultiversX roles |
| Wallet déclaré Studio | ⚠️ UX only — doit **matcher** issuer sinon rejet |

**Règle dApp :** Studio enregistre `creator_erd` ; Vellum ne paie que si `creator_erd == collection.owner/issuer` (ou whitelist ops).

---

## 2. 5 TRO collection — quand ?

**Décision : après le 1er NFT physique minté (pas à l’issue seul).**

| Option | Verdict |
|--------|---------|
| À l’issue collection | ❌ Issue sans œuvre = farm 5 TRO |
| Après 1er NFT physique mint | ✅ Preuve d’activité réelle |
| Après 1er list | Possible mais retarde créateurs qui mintent sans lister tout de suite |

**TX flow :** `ESDTNFTCreate` (1er nonce physical) → indexeur → `queue_collection_reward` **une fois**.

---

## 3. 1 TRO / NFT — quand ?

**Décision : à la première vente réussie (`buyNft` ou `acceptBid`), pas au mint ni au list.**

| Option | Verdict |
|--------|---------|
| Au mint | ❌ Spam mint 500 NFT vides |
| Au list | ❌ List/cancel/relist cycles |
| **Première vente** | ✅ TRO sort quand il y a **GMV** ; symbiose fee 3 % |

**TX flow :** event `buy` / `acceptBid` sur marketplace → si collection éligible + physical + `nft_id` jamais rewardé → `queue_nft_reward`.

*Exception ops :* airdrop manuel hors règle (ledger `status: manual`).

---

## 4. Pool 50k TRO v1 ?

**Décision : oui, plafond v1 = 50 000 TRO.**

- ~24 collections au max standard (505 TRO) si tout est full-cap — en pratique bien plus de collections partielles.
- Refill uniquement depuis policy treasury (fees claimées), jamais mint $TRO inflation cachée sans vote DAO.

---

## 5. Mode pro — manuel ou auto ?

**Décision : activation manuelle ops** (`TRO_REWARD_MODE=pro`).

- Auto sur fees crée un risque pro-cyclique (ouvrir digital farm trop tôt).
- Critères suggérés avant flip manuel : pool > 20k restant + ≥ N collections physical sold + fees claimées ≥ rewards paper 30j.

---

## 6. Circulating DAO vs poche incentives ?

**Décision : poche « incentives » séparée dans le reporting.**

- `distributed_tro` rewards ≠ « circulating free float » marketing sans contexte.
- DAO affiche : `circulating_approx` + ligne **incentives emitted (creators)**.
- Burn sleeve (100 bps fee) reste une ligne **burn** distincte.

---

## 7. KPI v1 prioritaire ?

**Décision : nombre de collections physiques avec ≥1 vente.**

Ordre de priorité v1 :

1. **Collections physiques avec vente** (qualité offre RWA)
2. GMV marketplace (suite naturelle du trigger vente)
3. Holders $TRO (effet 2nd order via rewards + DAO)

---

## Matrice TX → reward

| TX / event | Reward |
|------------|--------|
| issue collection | aucun |
| mint NFT physical #1 | **5 TRO** collection (si pas déjà) |
| mint NFT #2…N | aucun |
| list / cancel / bid | aucun |
| **buyNft / acceptBid** (1re fois cet nft_id) | **1 TRO** (si cap & physical & pool) |
| buy agent | aucun (autre produit) |

## Env Vellum

```bash
TRO_REWARD_MODE=standard
TRO_REWARDS_LIVE=0          # paper until ready
TRO_REWARD_POOL=50000
TRO_REWARD_TRIGGER=first_sale
TRO_COLLECTION_TRIGGER=first_physical_mint
```
