---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 9 novembre 2026

## Verdict

Le site public est le go-live. Le trading autonome, le checkout packs, Paybox prod, le slot REAL et `claimFees` ne le sont pas.

Un « go-live total » qui rallumerait LIA Ops parce que le site répond, parce que le nonce a déjà bougé le 30 octobre, ou parce que la fenêtre Upbit approche, reste une erreur de contrôle.

| | |
| --- | --- |
| **Live découverte** | https://neltud.github.io/xArtists/ |
| **Posture** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Sonde** | 2026-11-09T06:45:00Z · `api.multiversx.com` |
| **Epoch** | **2288** · rounds **79101** / 144000 · refreshRate **600** |
| **Supernova** | 600 ms toujours · activation historique epoch 2233 · **+55 epochs** |
| **EGLD** | **2,96 USD** · mcap **92,17 MUSD** · circ. 31 138 885 · staké 13 920 405 · APR **9,11 %** |
| **$TRO** | `TRO-94c925` · supply **476 224** · **557** comptes · **2820** tx · ~0,00008635 USD · mcap ~**41,12 USD** |
| **Agents SC** | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` · solde API **0,033 EGLD** · codeHash **inchangé** `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| **Packs** | Vente **suspendue**. Catalogue 110 / 75 / 50 €. Dernier relevé contrat 8 nov : 1 / 5 / 2,5 EGLD. Ce ne sont pas des devis exécutables. |
| **KR** | Notice Upbit `207379109` (23 oct) toujours la référence. Fenêtre **16–20 nov 2026**. Pas de levée indexée au 9 nov. |

Les soldes marketplace, slot, LIA Ops et treasury **ne sont pas re-sondés** dans ce passage. Le dernier récit ops reste la rafale du **30 oct 17:20–17:29 UTC** (8 TX, sortie TROMEX, 7,09 EGLD vers l’owner $TRO). Ce fait n’est pas une autorisation.

## Couches

| Couche | État 9 nov |
| --- | --- |
| Musée, galerie, studio | Surface publique. Suite UX déjà engagée (musée mobile, factory en 3 étapes, dossier droits local). |
| Marketplace | Lecture. Achat réel non homologué par ce document. |
| Agents / Genesis | SC présent. Médias URI non prouvés. Vente fermée des deux rails. |
| LIA | Paper. Nouvelle commande : classification FR/EN, devis EUR ≠ EGLD, mandat signé à usage unique. `executable` forcé à false. |
| $TRO | Supply inchangée depuis le 1er nov. Comptes 561 → 557. Pas un marché liquide. Bridge Solana toujours NO-GO. |
| Slot | Dernier constat écrit : REAL fermé, non payable. Non re-ouvert. |
| Treasury | Ne pas `claimFees`. Destination historique null. |
| Paybox | UI fail-closed. Pas de `PAYBOX_ENV=prod`. |
| Vellum (Hatom, relayer gasless, Apple/Google Pay) | Hors chemin critique tant que la notice KR n’est pas une levée **et** que la clé ops du 30 oct n’est pas sous garde exclusive. |

## Veille

* **Upbit**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT jusqu’au **16–20 novembre 2026**. Aucune notice de levée trouvée le 9 nov. Les dépôts ne sont pas re-constatés aujourd’hui ; la reprise des retraits d’octobre n’était pas une levée.
* **Prix** : 3,44 USD le 1er nov, **2,96 USD** ce matin. La baisse n’est pas un signal d’exécution. L’APR délégation reste ~9,11 %. Supernova n’exige pas de migration des délégants.
* **SDK** : `mx-sdk-js-core` **v16** est sorti (juillet 2026, correctifs post-audit et renommages). Le front public épingle encore `@multiversx/sdk-core` **13.17.2** et `@multiversx/sdk-dapp` **^3**, Vite **5**, Node **20** sur Pages. Ne pas sauter de majeure dans ce push.
* **Intent** : le trou P0 n’était pas un nouvel écran, mais l’absence d’un devis structuré qui refuse le live et sépare les rails. C’est ce que ce passage ferme, en paper.

## Ce passage

1. `lia/intent/mandate_ledger.py` — mandat HMAC, TTL, anti-rejeu, drapeau live retiré.
2. `lia/intent/buy_pack.py` — `BUY_PACK` / `STATUS` / `DISCOVERY` / `REFUSE`. Catalogue EUR et relevé EGLD dans des champs distincts.
3. Miroir navigateur `intentPaper.mjs`, panneau sur `/go-live`, tests des deux côtés.
4. CI Pages exécute `tests.regression.test_intent_paper` avec `LIA_LIVE_TRADING=0`.

## Interdit

* Signer LIA Ops, recharger le hot wallet, `claimFees`, slot REAL, `PAYBOX_ENV=prod`.
* Traiter 1 / 5 / 2,5 EGLD ou 110 / 75 / 50 € comme un prix payable.
* Committer une PEM, un secret HMAC de prod, ou `VITE_*_CODEHASH_OK=1`.
* Lire « le site est déployé » comme une ouverture commerciale.

## Suite

Voir `docs/SUITE_LOGIQUE_2026-11-09.md`.
