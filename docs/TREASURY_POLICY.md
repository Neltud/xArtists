# Treasury Policy — Fondation décentralisée xArtists

**Version** : 0.2 · **Réseau** : MultiversX mainnet · **Statut** : policy produit (à ratifier DAO / ops)

**Principe** : collecte = performance LIA (si live) + fees market + tips + services · **pas de vente de parts de fonds** · **pas de promesse « investissez, LIA vous fait gagner »**.

Appellation : **treasury de fondation décentralisée (protocol-owned)** — distincte d’un fonds LP classique ouvert au public.

---

## 1. Ce que nous sommes (et ne sommes pas)

| Fonds LP classique | xArtists |
|--------------------|----------|
| LP → fonds → achète de l’art | Activité on-chain / produit → treasury → mission + art |
| Promesse de performance aux souscripteurs | **Pas de souscription** : collecte = résultats + usage |
| GP régulé | Fondation décentralisée + règles on-chain / DAO |

La réussite autonome de LIA est un **moteur de treasury**, pas un produit vendu comme un fonds.

---

## 2. Wallets nommés

| Rôle | Adresse | Usage |
|------|---------|--------|
| **LIA Ops / Protocol** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | Exécution LIA, gas, balances Dashboard « protocole » — **jamais** login user |
| **BTC receive (ops)** | `bc1q0rvmym3mc4f5nmfuvpzvkvr236ptx5l243rt4d` | Visibility multi-chain (Portfolio) |
| **SOL receive (ops)** | `FEcBEmpNGv8yuAnuyAdnZneCMiJMnNGYKaw7cgSzNYwn` | Idem |
| **Treasury Mission** | `[erd1… À CRÉER / multisig]` | Grants, acquisitions art, drops fondation |
| **Treasury Reserve** | `[erd1… À CRÉER / multisig]` | Runway risque, drawdown LIA, imprévus |
| **Fee Collector (SC)** | SC marketplace (après deploy live) | Fees on-chain → withdraw → split |
| **User Connect** | Wallet de l’utilisateur | Tips / achats — **hors** treasury |

Tant que Mission / Reserve n’existent pas : tout concentré sur **LIA Ops** = **dette de transparence** (priorité).

Snapshot (août 2026) : LIA Ops ≈ **0,66+ EGLD** + $TRO + NFT ; SC market/staking/gov **vides** → fees on-chain = 0.

---

## 3. Sources de collecte

```
                    ┌─────────────────────────────┐
                    │  TREASURY FONDATION (DAO)   │
                    └─────────────▲───────────────┘
     ┌────────────┬───────────────┼───────────────┬────────────┐
  LIA PnL    Market fees    Tips / don    $TRO util.   Services
  (si réel)  (list/buy)     (user→proto)  (utility)    (abo…)
```

| Source | Condition | Split indicatif (brut) |
|--------|-----------|-------------------------|
| **Fees marketplace** | SC live + `codeHash` ≠ null | 40 % Mission · 30 % Reserve · 20 % Ops · 10 % incentives listings |
| **Tips** | Explicit « don protocole / mission » | 70 % Mission · 20 % Reserve · 10 % Ops |
| **Pub enchères (ads)** | Memo / SC V2 | 50 % Mission · 25 % Reserve · 15 % Ops · 10 % stakers P2 |
| **PnL LIA (live)** | `LIA_LIVE_TRADING=1` + micro-proof | 30 % Mission · 40 % Reserve · 20 % Ops · 10 % growth/MM |
| **PnL LIA (paper)** | `LIA_LIVE_TRADING=0` | **0 cash** — rapport simulé seulement |
| **Services** (packs agents 5–25 €, studio, **Editions**) | Facturation claire | 50 % Ops · 30 % Mission · 20 % Reserve |

Pourcentages = **paramètres DAO** (vote), pas LIA seule.

### Compartiments (cible)

| Bucket | % indicatif | Usage |
|--------|-------------|--------|
| Runway ops | 20–40 % | Infra, gas, dev, Pinata, audits |
| Mission art | 20–40 % | Grants, drops, acquisitions |
| Réserve / risque | 15–25 % | Drawdown LIA, imprévus |
| Growth / MM | 10–20 % | Liquidité prudente, incentives |

---

## 4. Qui peut bouger les fonds

| Action | Qui | Comment |
|--------|-----|---------|
| Trading / yield LIA | LIA (policy + kill switch) | Mandat écrit ; report hash / tx |
| Withdraw fees SC | Owner SC / multisig ops | Split §3 sous **≤ 7 jours** |
| Grants / achat art | Multisig Mission ou vote DAO | Mémo public |
| Reserve → Ops | Multisig + seuil | Au-delà de X EGLD : vote DAO |
| Mint $TRO | **Pas** LIA / **pas** Vellum | Governance humaine + cap **500 000** |
| Tips user | N/A | Déjà reçu selon memo tip:mission / tip:ops |

**LIA ne signe pas les grants Mission.** Elle peut **proposer** ; le DAO / multisig décide.

---

## 5. Rôle DAO $TRO

- Fixer % fee market et % split §3  
- Whitelist collections / éligibilité grants  
- Approuver sorties Reserve > seuil  
- **Ne pas** promettre « stake $TRO = yield LIA » sans mécanisme réel  
- **Ne pas** traiter $TRO comme share du fonds  

Supply max produit : **500 000 TRO** sauf vote documenté.

---

## 6. LIA — discipline treasury

- Mandat : univers, max drawdown, kill switch, `LIA_LIVE_TRADING` gated  
- GSN leaderboard = **score advisory** pré-trade (poids plafonné) — pas exécution seule  
- Paper d’abord ; live seulement après micro-proof  
- Séparer **Dashboard marketing** vs **cash on-chain auditable**  

---

## 7. Communication (régulatoire / réputation)

| OK | À éviter |
|----|----------|
| Tip / fee / perf = soutien protocole / mission | « Investissez, LIA vous fait gagner » |
| Fees après SC live | Afficher fees sans codeHash |
| Paper PnL clairement labellisé | Confondre paper et cash |
| Editions = lettre culturelle | Éditions = produit yield |

---

## 8. Séquence mission

1. Produit (market, studio, wallet) → fees + tips  
2. LIA (live prouvée) → grossit treasury  
3. DAO alloue grants / acquisitions / réserve  
4. Art détenu = **patrimoine de fondation** (mission), pas parts LP  

Un SPV co-invest tiers = **autre régime juridique** (hors scope v0).

---

## 9. Conditions d’activation cash

| Module | Avant activation |
|--------|------------------|
| Fees market | Deploy SC + codeHash + bandeau UI retiré |
| PnL LIA live | Paper stable + gates + flag explicite |
| Grants visibles | ≥1 grant/drop avec tx publique |
| Split auto | Script / procédure ≤ 7 j |

---

## 10. Reporting

| Fréquence | Contenu |
|-----------|---------|
| Continu | Adresses §2 publiques |
| Hebdo | Soldes multi-chain ; fees SC si live → `data/treasury_snapshot.json` |
| Mensuel | PnL paper **ou** live (séparés) ; grants ; % split respecté |
| Incident | Perte > seuil Reserve → post-mortem public |

UI : labels **LIA Ops** vs **Treasury Mission** vs **Mon wallet**.

---

## 11. Synthèse

Collecte = **LIA disciplinée** + **fees** + **tips** + **services** · allocation = **DAO / règles** · finalité = **mission artistique + résilience protocole**.  
Risque principal : promettre une perf LIA, mélanger tip et investissement, ou afficher des fees **sans** SC live.

---

## Prochaines actions

1. Créer Mission + Reserve (multisig) · publier adresses  
2. Deploy market → premier fee réel + split  
3. Ratifier policy (commit + vote DAO)  
4. Job hebdo treasury snapshot  
