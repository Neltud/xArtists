# Audit publication mainnet — xArtists (pré-hub xPortal)

## Gas / funding SC

**Non — il ne faut PAS financer chaque SC en EGLD « pour le gas ».**

Sur MultiversX, **l’utilisateur paie le gas** de chaque TX. Le solde d’un SC sert aux **réserves économiques** (caisse slot, progressive), pas au gas des appels.

| SC | Solde min utile | Pourquoi |
|----|-----------------|----------|
| Slot | ≥ 0,5 EGLD | Payouts + progressive (seed fait) |
| Marketplace | 0 | OK |
| TRO staking | 0 | OK (TRO stakés séparément) |
| Venue / Treasury | 0 | OK |

## Smart-unlock REAL

1. `VITE_LIVE_MODE=1` au build, **ou**
2. Explorer : `codeHash` = attendu **et** (slot) balance > 0 → session `runtimeCodehash` unlock.

Slot actuel : **0,5 EGLD** + codeHash match → REAL doit s’ouvrir après refresh.

## Routes live (App)

`/` musée marketplace agents my-packs slot staking wallet studio command trading portfolio tro lia market dao venues go-live legal identity

## Checklist hub xPortal

- [x] SC slot seedé
- [x] Disconnect wallet
- [x] Mentions légales (entrepreneur individuel / pas un fond d’investissement)
- [x] Smart-unlock REAL
- [ ] 1 spin user réel post-unlock
- [ ] 1 listNft signé xPortal
- [ ] Secrets Pages optionnels (renfort)
- [ ] Screenshots marketing

## Non-objectifs

- Ne pas promettre rendement / APY
- Packs paper jusqu’à minter SC
- Mode FUN toujours dispo si REAL indisponible
