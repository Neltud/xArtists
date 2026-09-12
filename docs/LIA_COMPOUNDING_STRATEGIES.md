# LIA — stratégies compounding (affinées)

**Snapshot ops (réf. UI)** : ~3,09 EGLD · ~$14 liquid · ESDT divers · mode board **PAPER**  
**Règle :** les tables « 5 trades/j · +1%/−0,8% » sont des **scénarios éducatifs**, pas une promesse ni un plan d’exécution brut.

---

## 1. Inventaire tradable vs non-tradable

| Actif | Rôle | Action compounding |
|-------|------|--------------------|
| **EGLD** (~3.09) | Gas + réserve + sleeve liquid | **Ne jamais descendre sous 1,50 EGLD** gas/ops |
| **TRO-94c925** | Token écosystème xArtists | Sleeve narrative ; swaps **micro** seulement si pool liquide (xExchange / OneDex) |
| **ASH** (~544) | ~$0,21 | Satellite DeFi ; compound seulement si fee << edge |
| **HWBTC / HTM** | Dust (~$0) | **Ignore** (pas de TX gas waste) |
| **TROUSDT / TROXOXNO LP** | Dust LP | **Ignore** ou leave |
| **NFTs / xMEX meta** | Collection / points | **Hors** moteur swap ESDT |

**Universe live autorisé (si trading on)** : `EGLD`, `TRO-94c925`, `ASH-a642d1`, pairs stables listées xExchange avec depth min.  
**Universe exclus** : dust, NFT, meta-ESDT non swap, tokens sans pool.

---

## 2. Trois stratégies (complètes)

### S1 — Capital preservation (défaut paper / micro-live)

- **But** : survivre + apprendre signaux, pas maximiser le × théorique  
- **Reserve** : ≥ **1,50 EGLD** intouchable  
- **Risk budget** : max **5 %** de la liquidité hors réserve par jour  
- **Trades/j** : 0–2 (pas 5) — gas Supernova faible mais edge doit battre fee  
- **Compound** : gains → 70 % réserve / 30 % sleeve signal  
- **Stop** : −8 % equity liquidité hors réserve → pause 7j

### S2 — Signal sleeve (GSN / fusion LIA)

- Inputs : board `GSN Elite MVX`, `GSN Alpha Macro`, fusion `WAIT/BUY` + conf  
- **Si conf < 0,55 ou bias WAIT** → **0 trade** (état actuel board : WAIT 0.5 → idle)  
- **Si BUY conf ≥ 0,65** : taille = min( risk budget, 0,05 EGLD equiv )  
- **Si SELL / risk-off** : réduire sleeve ASH/TRO vers EGLD (pas liquidate réserve)  
- **Compounding** : uniquement sur trades **clos** net de fees ; pas de martingale

### S3 — TRO ecosystem DCA (lent)

- **But** : accumulation TRO alignée narrative xArtists / Supernova  
- Fréquence : **1–2× / semaine**, pas intra-day spam  
- Taille : **0,02–0,05 EGLD** equiv si pool TRO depth OK  
- Jamais > **15 %** de l’equity hors réserve en TRO  
- Si prix TRO indisponible / pool thin → **skip**

---

## 3. Compounding — math honnête

| Paramètre | Valeur ops |
|-----------|------------|
| Equity liquide approx | ~$14–15 |
| Edge net cible / trade | ≥ fees × 3 |
| Trades/j réalistes | 0–2 |
| Horizon jalons paper | x2 ($20) … x10 ($100) = **objectifs board**, pas forecast |

La ligne « 100 % gagnants → $1.14B » du UI = **illustration mathématique**.  
LIA **ne doit pas** optimiser pour ce scénario.

---

## 4. Règles d’exécution (tous ESDT « confondus » filtrés)

1. Scanner balances ESDT + EGLD  
2. Filtrer dust (USD < $0,05 ou amount non swappable)  
3. Pour chaque candidat : pool depth, slippage max **1,5 %**, route xExchange → fallback OneDex  
4. Simuler paper → si `LIA_LIVE_TRADING=1` et gates OK → TX  
5. Journal : asset, side, size, conf, tx hash / paper id  
6. `board.publish` après chaque session

---

## 5. Gates (non négociables)

- `LIA_LIVE_TRADING` défaut **0** ; live seulement si ops force **1** + réserve EGLD OK  
- Wallet LIA ops ≠ user Connect dApp  
- Pas de leverage, pas de borrow, pas de drain réserve gas  
- Pas de promesse APY dans les messages Discord / X  
