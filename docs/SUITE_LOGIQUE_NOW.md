# Suite logique — 17 octobre 2026

## 0. Vérité (probe live)

- Epoch **2265** · refreshRate **600** · Supernova J+32
- EGLD **$3,70** · mcap ~$114,6M · staked 14,27M · APR ~8,88 %
- LIA Ops **1,6038 EGLD** · nonce 1473 · **paper only**
- Agents SC codeHash buyPack OK · getPackPrice Pulse **10** EGLD
- Market **0,0175** · Slot house **0,50** · isPayable=false
- $TRO ~$0,000080 · 562 comptes · illiquide
- **Build Pages** : `static.yml` échouait depuis le 16 oct 14:34 UTC (`buildUserSignPayload` non exporté). Le site servait encore **0.111.0**. Corrigé dans ce push. `VITE_LIA_LIVE_TRADING=0` sur le workflow (le `=1` du 16 oct n’a jamais été publié).

## 1. Ne pas allumer LIA live (bloquant externe)

**Upbit** : EGLD en liste « investissement sous surveillance » depuis le 21 sept.
Fenêtre de décision **19–23 octobre 2026** (dans 2–6 jours).
→ `LIA_LIVE_TRADING=0` forcé. Pas de micro-trade live tant que la liquidité CEX n’est pas clarifiée.

## 2. Preuve produit (1 TX user) — priorité P0

Ordre recommandé, micro montants, wallet **utilisateur** (pas LIA Ops) :

1. Connect xPortal / Web Wallet
2. Stake **1 TRO** → tro_staking (déjà prouvé historiquement)
3. **ou** Buy pack Sentinel 2,5 EGLD (dépense réelle → mint NFT)
4. **ou** Bid / buy listing #2 (0,25 EGLD) — attention id #1 mort
5. Documenter tx hash dans `docs/ONCHAIN_MICRO_PROOFS.md`

Sans 1 TX user visible explorer → ne pas annoncer « LIVE public retail ».

## 3. Slot REAL

Rester fermé tant que `isPayable=false` sur le compte.
Ne pas forcer `VITE_SLOT_CODEHASH_OK=1` en secret Pages.
Runtime gate v4 + balance + isPayable = source de vérité.

## 4. Packs agents

- Runtime codehash unlock OK (hash buyPack dans config)
- Prix officiels : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD
- Paper mint = DEV only
- Achat live = vrais EGLD + mint on-chain

## 5. Hygiène technique (cette passe)

- Deprecations npm : lodash.omit/isequal, uuid@8/9, @multiversx/sdk-network-providers@2 (intégré sdk-core), @walletconnect/sign-client, recharts 2.x, fontawesome 0.2
- Node 20 → viser Node 22/24 sur runners Pages quand possible
- Ne pas merger Dependabot majors (vite 8, eslint 10) sans QA

## 6. Ne pas faire

- Committer `VITE_*_CODEHASH_OK=1` dans le repo
- Financer placeholders legacy empty
- Coller PEM / secrets
- Annoncer un fonds retail
- Router fees tant que treasury dest = null
- Allumer LIA trading avant décision Upbit + Guardian + caps + 1 micro-proof

## 7. Après Upbit (si maintien)

1. 1 micro-trade LIA signé xPortal (ops) + journal
2. MX-8004 First 100 registration
3. Fund slot progressive + 1 spin REAL dust
4. Index listings on-chain (plus d’id manuel)
5. Akash / VITE_BRAIN_WS optionnel
