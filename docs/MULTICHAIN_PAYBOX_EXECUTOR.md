---
hidden: true
noIndex: true
---

# Multichain Trading — LIA Brain → PayBox Executor

**Date:** 2026-10-17\
**Status:** Architecture historique uniquement — **NO-SEND / NO-LIVE** sans preuve actuelle de la gestion des credentials et de l'adresse; MultiversX reste paper / user-sign

***

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LIA BRAIN (lia/brain/* · circuit · signals · guardian) │
│  Décision: BUY/SELL/HOLD · taille · chaîne · asset      │
└───────────────────────────┬─────────────────────────────┘
                            │ DecisionProof (JSON)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  ROUTER multichain                                      │
│  · MultiversX → TxShell user / LIA PEM (paper until     │
│    go_live_gates + micro-proofs)                        │
│  · Solana / EVM → PayBox executor (ce module)           │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     PayBox Solana                 PayBox EVM
     (credential sol-default)      (credential evm-default)
```

## 2. Doctrine (alignée dapp\_sync)

État vérifié au 2026-10-21 : le module Python prépare des intents ; aucun appel PayBox n'est implémenté dans ce dépôt. Le connecteur PayBox crypto n'est pas disponible dans la session d'implémentation. Les indications de wallets et de credentials de la session du 17 octobre ci-dessous sont historiques, pas une preuve d'accès actuel. Un intent et une réponse prestataire ne prouvent pas une exécution on-chain.

L'adaptateur demande désormais un solde observé, un prix USD daté de moins de 60 secondes, le budget journalier déjà consommé et un compte explicitement sélectionné. Il plafonne les intents à 15 USD et 40 USD/jour et garde la réserve de gas ; les valeurs fournies doivent être réconciliées par le futur connecteur. Il ne suppose plus un financement de 0,15 SOL et ne réutilise plus un credential codé en dur. Les retours prestataire restent `pending_confirmation` jusqu'à une vérification de chaîne distincte, à implémenter.

| Règle                               | Valeur                                             |
| ----------------------------------- | -------------------------------------------------- |
| Paper first sur MultiversX          | `LIA_LIVE_TRADING=0` jusqu’à gates                 |
| PayBox = exécution **user-granted** | Credentials accordés à Grok, signature client-side |
| Fail closed                         | Pas de swap si solde insuffisant / route absente   |
| Caps micro                          | Premier leg ≤ 50 % du SOL dispo, garder gas        |
| Pas de PEM dans git                 | PayBox ne stocke pas de clé serveur                |
| Journal                             | Chaque exécution → `data/paybox_legs.json`         |

## 3. Chaînes supportées (PayBox)

| Chaîne             | CAIP-2           | Rôle                                   |
| ------------------ | ---------------- | -------------------------------------- |
| Solana             | `solana:mainnet` | Intents uniquement dans ce dépôt ; exécution réelle seulement après OAuth, approbation wallet et preuve on-chain |
| EVM (Base, ETH, …) | `eip155:*`       | Quand wallet EVM financé               |
| MultiversX         | —                | **Hors PayBox** — xPortal / PEM vault  |

## 4. Flux décision → exécution

1.  **Brain** produit un intent :

    ```json
    {
      "action": "SWAP",
      "src_chain": "solana:mainnet",
      "src_token": "native",
      "dst_token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount_atomic": "70000000",
      "reason": "BASE_USDC_FOR_TRADING",
      "confidence": 0.9,
      "max_slippage_bps": 100
    }
    ```
2. **Pretrade / Guardian** valide obligatoirement taille, cotation, budget et mode.
3. **PayBox** : `get_portfolio` → `request_swap` → poll `get_request` → journal.
4. **Post-trade** : MAJ portfolio + `paybox_legs.json` pour le dApp.

## 5. Wallets ops historiques (session 2026-10-17) — ne PAS financer directement

| Credential  | Adresse                                        | Chaîne |
| ----------- | ---------------------------------------------- | ------ |
| sol-default | `Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN` | Solana |
| evm-default | `0xc603c5b2013bcbc54238a6f7ca503992493f2e41`   | EVM    |


> **STOP FINANCEMENT (3 novembre 2026).** L'adresse ci-dessous est une **référence historique**, pas une adresse de dépôt actuellement autorisée. Une vérification publique de Solscan a montré 0 SOL / « Account does not exist onchain » ; cela ne prouve ni que le wallet est perdu, ni que PayBox le contrôle. La lecture d'une adresse dans GitHub ou l'explorateur ne démontre jamais la possession de la clé. **Ne pas envoyer de SOL, USDC, ETH, EGLD ou autres tokens à une adresse non revalidée.**

### Protocole de confirmation avant un premier transfert

1. Le propriétaire ouvre [PayBox](https://paybox.sh/) sur son propre compte et vérifie l'identifiant du credential Solana **actuellement** connecté, le réseau `solana:mainnet`, le wallet public affiché et son contrôle d'approbation/passkey. Aucun mot de passe, clé privée ou seed en chat ou dans le dépôt.
2. Établir la connexion officielle via OAuth + MCP `https://api.paybox.sh/mcp` **avec l'accord explicite du propriétaire**. Après accord, lire les credentials autorisés / le portefeuille. Ne jamais supposer que `sol-default` est toujours présent simplement parce que le texte de 2026 le cite.
3. Faire correspondre exactement l'adresse publique et le réseau avec ce que PayBox affiche. En cas de divergence, **STOP** et corriger la configuration sans envoyer de fonds.
4. Vérifier si PayBox permet une preuve de signature/contrôle approuvée via passkey ; valider la preuve cryptographiquement ou par un historique de transaction signée. Un explorateur et un solde `0` ne prouvent pas le contrôle.
5. Relever les mints SPL exacts des tokens, les coûts d'ouverture de token account, le SOL nécessaire pour fees, les minimums et la politique de transfert ; sur de petits soldes, ne pas déplacer des poussières (« dust ») à perte.
6. **Seulement après** ces preuves : le propriétaire autorise un microtransfert **SOL natif sur Solana** vers l'adresse revalidée, confirme le bénéficiaire sur son appareil et conserve un hash de transaction finalisée. Prévoir les frais et ne jamais envoyer EGLD, ETH EVM, AVAX ni ERC-20 à une adresse Solana.
7. Ne pas activer `LIA_LIVE_TRADING`, la vente `TRO`, le bridge, ni les paiements PayBox System/Verifone à l'occasion du financement d'un wallet. Le PayBox.sh non custodial et le PSP Verifone sont **deux services distincts**.

**Blocage suivi :** [#353 — Verify PayBox Solana recipient before funding](https://github.com/Neltud/xArtists/issues/353). Documentation officielle : [PayBox / OAuth MCP](https://docs.paybox.sh/). Aucun envoi ni signature déclenché par cette procédure.

## 6. Premier leg (bootstrap)

* **Intent purement théorique, PAS autorisation d'échange :** convertir une partie du SOL en USDC seulement si la preuve #353 et les gates de trading sont indépendamment satisfaites.
* **Garder** ≥ 0.02 SOL pour les fees.
* **Ne pas** allumer le live MultiversX.

## 7. Modules code

| Fichier                              | Rôle                                    |
| ------------------------------------ | --------------------------------------- |
| `lia/executor/paybox_router.py`      | Intent → payload PayBox + journal local |
| `docs/MULTICHAIN_PAYBOX_EXECUTOR.md` | Cette doctrine                          |
| `data/paybox_legs.json`              | Historique des legs (publiable dApp)    |

## 8. Interdits

* Router des fees MultiversX via PayBox
* Confondre wallet PayBox et deployer `erd1kex0p…`
* Swap 100 % du SOL (gas stuck)
* Live MultiversX sans `go_live_gates` + micro-proof user
