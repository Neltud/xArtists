# Mentions legales & processus xArtists

> Mise a jour : 2026-09-29
> Site : https://neltud.github.io/xArtists/
> Repo : https://github.com/Neltud/xArtists

## 1. Identite editeur

| Champ | Valeur |
|--------|--------|
| Produit | xArtists |
| Editeur | Nelson Tuduri |
| Pays | France |
| **SIRET** | **A completer** (14 chiffres officiels) |
| Forme | A preciser (EI / societe) |
| Contact | Issues GitHub Neltud/xArtists |
| Hebergeur front | GitHub Pages |
| Chaine | MultiversX mainnet |

Tant que le SIRET n'est pas renseigne dans `apps/frontend/src/config/legalEntity.ts` (`siretStatus: 'ok'`), la page `/legal` affiche un bandeau « a completer ».

**Action editeur** : fournir le SIRET → mettre a jour `LEGAL_ENTITY.siret` + `siretStatus: 'ok'`.

## 2. Ce que la dApp fait / ne fait pas

- **Fait** : UI paper, lecture API MultiversX, connexion wallet, TX utilisateur vers SC gatees.
- **Ne fait pas** : custody de fonds, promesse de rendement, signature avec PEM utilisateur, usage du wallet LIA comme compte end-user.

## 3. Processus connexion wallet

1. Clic **Connect** (Header).
2. **Web Wallet** → redirect `wallet.multiversx.com/hook/login` + callback dApp.
3. **xPortal** → WalletConnect V2 :
   - mobile : universal link / app ;
   - **desktop : popup QR** (scan depuis le telephone) + attente approval.
4. **Extension** DeFi Wallet si injectee.
5. Coller `erd1…` → session **lecture seule** (pas de signature).

## 4. Processus CODEHASH / fail-closed

1. Deploy SC mainnet (Actions + PEM ops).
2. Verifier `codeHash` via `api.multiversx.com/accounts/{addr}`.
3. Enregistrer dans `data/contracts.json`.
4. Secrets GitHub Pages uniquement (jamais commit `=1`) :
   - `VITE_TRO_STAKING_CODEHASH_OK`
   - `VITE_MARKETPLACE_CODEHASH_OK`
   - `VITE_VENUE_CODEHASH_OK`
5. Rebuild Pages → UI LIVE.

## 5. Processus stake $TRO (dust)

1. Wallet utilisateur + TRO-94c925 (6 decimals).
2. `/staking` onglet TRO → montant → **Stake $TRO**.
3. Bridge `__xartistsSendTx` : sdk-dapp **ou** hook Web Wallet.
4. Data type : `ESDTTransfer@TRO-94c925@{atomic}@stake`.
5. Si erreur VM `non payable` → bytecode SC ≠ source payable → **upgrade** avant relance.

Microtest ops : workflow `microtest-tro-stake.yml` (`confirm=RUN_STAKE`).

## 6. Processus marketplace / venue

- List / buy NFT : gate `VITE_MARKETPLACE_CODEHASH_OK`.
- rentPay venue : gate `VITE_VENUE_CODEHASH_OK`.
- Ordre microtests : TRO stake → market dust → venue dust.

## 7. Deployements SC

| SC | Status (2026-09-29) |
|----|---------------------|
| venue_split, nft_marketplace, agents_marketplace | LIVE |
| nft_staking, tro_staking, tro_governance | LIVE |
| agent_stake_escrow, treasury_splitter | LIVE |
| **slot_casino** | **NOT_DEPLOYED** |

Deploy slot : workflow `deploy-slot-casino.yml` input `confirm_mainnet=DEPLOY_MAINNET`.

PEM : secret `SC_DEPLOYER_PEM` uniquement. Jamais dans le chat ni le repo.

## 8. Documentation liee

- `docs/CLICK_TX_MATRIX.md` — matrice clics → TX
- `docs/DEPLOYMENT.md` — deploiements
- `docs/MISSION_A_FRONTEND.md` — gates front
- Page UI `/legal` — mentions / CGU / privacy / risques / processus

## 9. Checklist editeur avant com publique

- [ ] SIRET + adresse siege dans `legalEntity.ts`
- [ ] Contact e-mail si souhaite
- [ ] CGU / risques relues
- [ ] CODEHASH secrets alignes codeHash explorer
- [ ] Au moins un microtest stake / market reussi on-chain
