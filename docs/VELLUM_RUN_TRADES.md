# Prompt Vellum — construire & démarrer trades (ESDT filtrés)

## Copier dans Vellum

```
==========================================================================
RUN VELLUM — LIA TRADING ENGINE + COMPOUNDING
==========================================================================
Wallet ops : erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
Réseau : MultiversX MAINNET (Supernova)
Réf stratégies : docs/LIA_COMPOUNDING_STRATEGIES.md (repo Neltud/xArtists)

PHASE 0 — INVENTAIRE (obligatoire)
1. Lire balances EGLD + tous ESDT + NFTs (NFTs = hors swap)
2. Classer : tradable / dust / ignore
3. Calculer réserve gas = max(1.50 EGLD, 40% du solde EGLD)
4. Risk budget jour = 5% de (liquidité USD hors réserve)
5. Publier snapshot board (paper)

PHASE 1 — CONSTRUIRE LE MOTEUR (si pas déjà)
- Strategies actives : S1 Preservation (default) + S2 Signal sleeve + S3 TRO DCA lent
- Universe : EGLD, TRO-94c925, ASH-a642d1 (+ autres ESDT seulement si USD≥0.05 ET pool liquide)
- Exclure : HTM dust, HWBTC dust, LP dust, tous NFT/MetaESDT
- Slippage max 1.5% · pas de martingale · max 2 tentatives trade / jour en live
- Journal JSON append-only (paper ids ou tx hash)

PHASE 2 — PAPER SESSION (toujours en premier dans ce run)
- Lire signaux GSN / fusion LIA
- Si bias WAIT ou conf < 0.55 → **0 trade**, status Monitor idle, board.publish PAPER
- Si BUY conf ≥ 0.65 → simuler 1 micro trade taille min(risk budget, 0.05 EGLD equiv)
- Compounding paper : appliquer S1 split 70/30 sur PnL simulé
- board.publish résultats

PHASE 3 — LIVE (seulement si les 3 conditions sont vraies)
  (a) env LIA_LIVE_TRADING=1 explicitement set pour ce run
  (b) EGLD ≥ 1.50 après fees estimés
  (c) PHASE 2 paper sans erreur + conf ≥ 0.65
Sinon : rester PAPER et rapporter « live skipped ».

Si LIVE autorisé :
- Exécuter au plus 1 swap (S2 ou S3), pas un panier multi-dust
- « Tous ESDT confondus » = scanner tous, trader UNIQUEMENT universe filtrée
- Après TX : verify explorer, update balances, board.publish
- Stop si slippage réel > 1.5% ou erreur contrat

INTERDIT
- Vider EGLD sous 1.50
- 5 trades/j forcés
- Optimiser vers scénario « 100% wins $1B »
- Logger PEM / seeds
- DEMO_MODE=false ou SC deploy dans ce run

LIVRABLES
1) Table inventaire (asset, bal, USD, tradable Y/N)
2) Décision : PAPER only | 1 live TX | idle WAIT
3) Si TX : hash + route + fees
4) EGLD restant + risk budget restant
5) Prochaine session recommandée (horaire / condition signal)
==========================================================================
```

## Note ops

État board actuel (UI) : **PAPER · WAIT · conf≈0.50** → un run honnête doit souvent conclure **idle**, pas forcer des trades.
