# Feuille de route — du prototype à l’infrastructure de confiance

> **État public (2026-08-30)** : [demo](https://neltud.github.io/xArtists/) paper / GO_DEMO · trading live **OFF** · packs Pulse · Yield · Sentinel · tours artistiques = service CULTURE, pas un pack agent.
>
> Roadmap d’ingénierie. Rien ici n’allume le live à lui seul.

---

## Sprint 1 — La réalité (connexion & visibilité)

Focus : voir le vrai wallet user, sans fake.

| # | Type | Livrable |
|---|------|----------|
| 1 | TECH | Durcir WalletConnect / sdk-dapp (QR + xPortal + extension + Web Wallet) |
| 2 | TECH | Unifier `useMultiversX` + `AssetService` (API MultiversX) |
| 3 | UI | **Reality Switch** paper vs live — cyan vs vert, fail-closed |
| 4 | UI | **Asset Drawer** tokens & NFTs (skeletons) |
| 5 | REFACTOR | Supprimer les `setTimeout` « success » des services de base |

Déjà là : session Web Wallet / extension / xPortal, lecture soldes. Manque : switch visible, drawer, watcher, WC QR bout-en-bout.

---

## Sprint 2 — L’agenticité réelle (exécution & sécurité)

Focus : intention → signature **user** → chaîne.

| # | Type | Livrable |
|---|------|----------|
| 1 | SEC | `TransactionGuardian` complet (montant, slippage, dest, anti-scam) |
| 2 | TECH | `TransactionWatcher` (PENDING → SUCCESS sur hash réel) |
| 3 | TECH | Intent schema dans le flux tx (⌘K → Guardian → sign) |
| 4 | UX | Cycle testé : commande texte → signature wallet → confirmation → feedback UI |

Live trading reste **OFF** jusqu’aux gates (`LIA_LIVE_TRADING` + confirm user + doctrine + codeHash). Micro-preuve possible : tip EGLD signé user, étiqueté, sans desk LIA live.

---

## Sprint 3 — L’écosystème (expansion)

| # | Type | Livrable |
|---|------|----------|
| 1 | UX | Audit de portefeuille par LIA (lecture wallet **user**, paper par défaut) |
| 2 | UX | Travel Art Tour — carte lieux d’art (service **CULTURE**, pas un pack Pulse/Yield/Sentinel) |
| 3 | MKT | Vidéo demo « simu → signature réelle » — sans claim gasless / swap auto |

---

## Non-goals

- Promettre le live tant que `LIA_LIVE_TRADING=0`
- Confondre wallet LIA ops et wallet user
- Pack « Art Tour » dans le marketplace agents
- Fake-success, gasless live, swap auto non déployé

Détail UX : [`REALITY_SWITCH.md`](REALITY_SWITCH.md) · Specs : [`LIVE_EXECUTION_SPECS.md`](LIVE_EXECUTION_SPECS.md).
