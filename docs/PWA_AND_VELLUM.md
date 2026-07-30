# PWA mobile + nœuds Vellum

## 1. Installer l’app sur le téléphone (PWA)

Ce n’est **pas** une app App Store / Play Store native, mais une **Progressive Web App** : icône sur l’écran d’accueil, ouverture plein écran, cache offline partiel.

### Android (Chrome)
1. Ouvre https://neltud.github.io/xArtists
2. Menu ⋮ → **Installer l’application** / **Ajouter à l’écran d’accueil**
3. Ou bandeau **Installer xArtists** dans l’app

### iPhone (Safari)
1. Ouvre le site dans **Safari** (pas Chrome)
2. Bouton **Partager** → **Sur l’écran d’accueil**
3. Confirme **Ajouter**

### Technique repo
- `apps/frontend/public/manifest.webmanifest`
- `apps/frontend/public/service-worker.js`
- `apps/frontend/src/pwa/registerSW.ts`
- `apps/frontend/src/components/PwaInstallBanner.tsx`

Après deploy frontend : recharger une fois, puis installer.

### Limites
- Wallet : xPortal / WalletConnect dans le navigateur intégré
- Notifications push : optionnel plus tard
- Pour une vraie app stores : Capacitor/React Native (phase 2)

---

## 2. Nœuds Vellum à intégrer

**Code :** `lia/vellum/nodes_trailing_cycle.py`

| Node | Fonction |
|------|----------|
| `gate_cycle` | SKIP si WAIT, low confidence, max trades/jour, frais trop hauts |
| `open_trailing` | Ouvre position + trailing hybrid |
| `trailing_tick` | MAJ stops ; `should_close` si STOP |
| `append_trade` | Log dans `data/lia_trades.json` |

### Schéma workflow Vellum

```
[Timer 1–2h]
    → Fetch prix TRO/EGLD + ATR
    → gate_cycle(confidence, decision, size, fees…)
    → si EXEC : signal + (optionnel) UniversalExecutor open
    → open_trailing(...)
    → append_trade(...)
    → pour chaque position OPEN : trailing_tick(token, price, atr)
    → si should_close : Executor close + append_trade status CLOSED
    → Push GitHub data/lia_*.json (reporter existant)
```

### Exemple appel Python (node Vellum)

```python
from lia.vellum.nodes_trailing_cycle import node_dispatch

print(node_dispatch("gate_cycle", {
  "confidence": 0.72,
  "decision": "BUY",
  "size_usd": 12.0,
  "estimated_fee_usd": 0.15,
  "expected_edge_usd": 1.5,
  "trades_today": 1,
}))

print(node_dispatch("trailing_tick", {
  "token": "TRO-94c925",
  "price": 0.000068,
  "atr": 0.000002,
}))
```

Le runner Vellum doit avoir le repo cloné (ou package `lia`) + secrets PEM si live trading.
