# LIA treasury policy (public)

## Seuil
Quand le solde **USDC** (token `USDC-c76f1f` sur MultiversX) du wallet LIA dépasse **10 USDC**, la politique de placement est **armée**.

En dessous : aucune intention d’investissement automatisée n’est considérée « ready ».

## Ordre des rails
1. **MultiversX** — xExchange, pools TRO/USDC, Hatom (selon Guardian)
2. **Solana** — après runbook validé
3. **Soul Protocol ($SO)** — lend + stake omnichain quand mainnet public + contrats vérifiés

## Exécution
- Front démo : **lecture** solde + statut (armée / attente)
- Exécution réelle : **Vellum + Guardian** — pas de `setTimeout` fake-success, pas de clé en front
- `LIVE_TRADING` reste un flag ops

## Soul ($SO)
Intentions paper `lend` / `stake` préparées dans `soulProtocol.ts`. TGE / circulating figures = sources publiques ; dates non figées.
