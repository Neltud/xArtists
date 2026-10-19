# Suite logique — 19 octobre 2026

**Audit Grok (lecture + write pass) :** [`AUDIT_GROK_2026-10-17.md`](./AUDIT_GROK_2026-10-17.md)  
**Design validé :** [`DESIGN_VALIDATED_DELIVERY.md`](./DESIGN_VALIDATED_DELIVERY.md)

## 0. Vérité (probe live — à rafraîchir)

- Epoch **2265** · refreshRate **600** · Supernova J+32 (snapshot 17 oct)
- EGLD **$3,70** · mcap ~$114,6M · staked 14,27M · APR ~8,88 %
- LIA Ops **1,6038 EGLD** · nonce 1473 · **paper only**
- Agents SC codeHash buyPack OK · getPackPrice Pulse **10** EGLD
- Market **0,0175** · Slot house **0,50** · isPayable=false
- $TRO ~$0,000080 · 562 comptes · illiquide
- **Build Pages** : corrigé 17 oct (`buildUserSignPayload`). `VITE_LIA_LIVE_TRADING=0` sur le workflow.

## 1. Ne pas allumer LIA live (bloquant externe)

**Upbit** : EGLD en liste « investissement sous surveillance » depuis le 21 sept.  
Fenêtre de décision **19–23 octobre 2026** (aujourd’hui → +4 j).  
→ `LIA_LIVE_TRADING=0` forcé. Pas de micro-trade live tant que la liquidité CEX n’est pas clarifiée.

## 2. Preuve produit (1 TX user) — priorité P0

Ordre recommandé, micro montants, wallet **utilisateur** (pas LIA Ops) :

1. Connect xPortal / Web Wallet
2. Stake **1 TRO** → tro_staking (déjà prouvé historiquement)
3. **ou** Buy pack Sentinel **2,5 EGLD** (dépense réelle → mint NFT)
4. **ou** Bid / buy listing #2 (0,25 EGLD) — attention id #1 mort
5. Documenter tx hash dans [`ONCHAIN_MICRO_PROOFS.md`](./ONCHAIN_MICRO_PROOFS.md)

Sans 1 TX user visible explorer → ne pas annoncer « LIVE public retail ».

## 3. Slot REAL

Rester fermé tant que `isPayable=false` sur le compte.  
Ne pas forcer `VITE_SLOT_CODEHASH_OK=1` en secret Pages.  
Runtime gate v4 + balance + isPayable = source de vérité.

## 4. Packs agents

- Runtime codehash unlock OK (hash buyPack dans config)
- Prix on-chain : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD
- Prix fiat (catalogue serveur) : Pulse **110** / Yield **75** / Sentinel **50** €
- Paper mint = DEV only
- Achat live = vrais EGLD + mint on-chain
- **Fiat / Paybox** : fail-closed jusqu’à HMAC + IPN + mint prouvés (`VITE_PAYBOX_ENABLED=false`)

## 5. Hygiène technique

- Deprecations npm : lodash.omit/isequal, uuid@8/9, @multiversx/sdk-network-providers@2, @walletconnect/sign-client, recharts 2.x, fontawesome 0.2
- Node 20 → viser Node 22/24 sur runners Pages quand possible
- Ne pas merger Dependabot majors (vite 8, eslint 10) sans QA
- **2026-10-17 Grok write pass :** WarpsMintAgent UX honnête · Stripe stub fail-closed · audit doc
- **2026-10-19 daily safety :** Paybox 501 · opt-in `VITE_PAYBOX_ENABLED` · fiat exige erd1 · prix doc alignés 110/75/50

## 6. Ne pas faire

- Committer `VITE_*_CODEHASH_OK=1` dans le repo
- Financer placeholders legacy empty
- Coller PEM / secrets
- Annoncer un fonds retail
- Router fees tant que treasury dest = null
- Allumer LIA trading avant décision Upbit + Guardian + caps + 1 micro-proof
- Activer Paybox / Stripe réel avant preuve IPN + livraison NFT

## 7. Après Upbit (si maintien)

1. 1 micro-trade LIA signé xPortal (ops) + journal
2. MX-8004 First 100 registration
3. Fund slot progressive + 1 spin REAL dust
4. Index listings on-chain (plus d’id manuel)
5. Akash / VITE_BRAIN_WS optionnel
