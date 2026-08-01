# Treasury flows xArtists

## A. NFT marketplace

```text
Collector
  └─ buyNft(price in EGLD today)
      ├─ seller proceeds
      ├─ protocol fee (fee_bps)
      ├─ royalties artist
      └─ tips / optional service flows
```

- `fee_bps` = fee protocole
- royalties = part artiste / créateur
- tips = extra volontaire, distinct de la fee protocole
- gap actuel : burn TRO non branché on-chain

## B. Agents marketplace

```text
Collector / user
  └─ buyAgentAction(price in EGLD)
      ├─ seller / issuer proceeds
      ├─ protocol fee (fee_bps)
      └─ catalog remaining updated from data/agents_catalog.json
```

- source of truth remaining : `data/agents_catalog.json`
- Warps et frontend doivent lire la même adresse `agents_marketplace`
- gap actuel : checkout multi-currency non livré

## C. LIA treasury circuit

```text
Trading profit
  ├─ 70% → compound_equity
  └─ 30% → yield_sleeve

Losses
  └─ compound_equity absorbs PnL down

3 consecutive losses
  └─ HALTED

TRO received by LIA
  └─ redistribute policy
      ├─ 40% LP
      ├─ 30% stake
      ├─ 20% rewards
      └─ 10% burn target
```

- LIA ne hold pas TRO en trésorerie opérationnelle
- l’utilisateur, lui, peut stake TRO côté produit / DAO
- `yield_sleeve` = poche rendement séparée du compounding

## Gaps actuels

- burn TRO marketplace non implémenté on-chain
- achat multi-currency NFT/Agents incomplet
- affichage UI encore à aligner partout sur `fee_bps` / royalties / tips
- halt / streak à propager sur toutes les pages DeFi
