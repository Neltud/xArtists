# Prochaines étapes + cohérence (2026-08-04)

## Cohérence info ↔ actions

| Affichage | Action réelle |
|-----------|---------------|
| DAO « live holders » | API MVX `/tokens/TRO-94c925` + `/accounts` |
| DAO Vote | **Pas** de TX — lecture seule |
| Studio « Publier » | Checklist + liens wallet/Pinata — **pas** mint auto tant que minter non branché |
| Market List/Buy | Bloqué tant que SC codeHash null |
| Dashboard LIA | Wallet protocole ≠ Connect user |
| $TRO supply UI | Cap produit **500 000** (API circ ~476k raw units décimales) |
| LIA trading | `LIA_LIVE_TRADING=0` |

## Priorité

1. **P0** Vellum deploy SC marketplace + agents + codeHash  
2. **P0** Signature user (extension / Web Wallet)  
3. **P0** Pages rebuild (Studio/DAO/nav)  
4. **P1** Studio mint auto (minter SC + pin proxy)  
5. **P1** Index listings  
6. **P2** Vote DAO TX  

## Questions prioritaires

1. Deploy SC déjà lancé côté Vellum / machine locale ? (adresses `erd1`)  
2. Governance SC vote : endpoints ABI connus pour brancher plus tard ?  
3. Mint Studio : collection unique xArtists ou issue libre par artiste ?  
4. Top holders DAO : masquer les SC system (burn role) ou tout afficher ?  
