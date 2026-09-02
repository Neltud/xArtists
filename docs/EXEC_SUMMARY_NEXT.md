# Résumé exécutif — audit + suite (2026-08-05)

## Verdict

La dApp est **lisible et orientée produit** (Studio / Market / Agents / DAO / multi-chain LIA).  
Elle n’est **pas encore une machine à cash on-chain** : SC marketplace & agents **non live** (codeHash null).

---

## Bugs corrigés cette passe

| Bug | Fix |
|-----|-----|
| `useWalletTokens()` sans arg cassait Hatom/LP après changement null | `undefined` → LIA ; `null` → skip ; `string` → compte |
| Wallet ↔ Portfolio doublon | Wallet = user only ; Portfolio = LIA + BTC/SOL |
| Nav sans Editions | PRIMARY_NAV + route `/editions` |
| Bottom mobile confus $TRO/DAO | Barre : Home · Studio · Market · Agents · **LIA** · Wallet |

---

## Lacunes restantes (par sévérité)

### P0 — bloquants production réelle

1. **Deploy** nft-marketplace + agents-marketplace (EGLD + PEM)  
2. **codeHash** vérifié + `contracts.json` + `VITE_*`  
3. **Rebuild GH Pages** (Actions) pour front live  
4. **Signature wallet** réelle List/Buy (sdk-dapp / extension)  
5. Wallets **Mission + Reserve** (TREASURY_POLICY)  

### P1 — conversion & crédibilité

- Index listings (fin ID manuel)  
- Studio pin auto Pinata via backend  
- Premier split fees / ads  
- Board JSON auto-publish Vellum (`lia.board.publish`)  
- Stripe Editions (au-delà memo tip)  

### P2

- Vote DAO on-chain  
- Offer escrow dédié  
- Soul zk mainnet  
- `LIA_LIVE_TRADING=1` après micro-trades  

---

## Ce qui marche en lecture

| Zone | État |
|------|------|
| Galerie / catalogue NFT | ✅ |
| DAO holders $TRO API | ✅ lecture seule |
| Agents 3 couches + GSN score | ✅ |
| Portfolio multi-chain EGLD/BTC/SOL | ✅ |
| Tip multi-chain | ✅ |
| Ads / Editions UI | ✅ MVP |
| Policy fondation | ✅ docs/TREASURY_POLICY.md v0.2 |

---

## Suite de travail recommandée (ordre)

1. **Rebuild Pages** (voir commits main)  
2. Top-up EGLD si besoin → **simulate deploy** → **deploy** 2 SC  
3. `post_deploy_contracts.py` + verify codeHash  
4. Micro List/Buy user wallet  
5. Créer Mission/Reserve · publier adresses  
6. Indexeur listings + retirer bannières P0  
7. Garder `LIA_LIVE_TRADING=0` jusqu’à preuve micro  

---

## Règles métier figées

- 1 $TRO max reward NFT physique (1ère vente)  
- Packs sub-agents **5–25 €**  
- $TRO supply max **500 000**  
- Tip ≠ investissement · Ads ≠ investissement  
- GSN = advisory pré-trade, pas packs vendus  
