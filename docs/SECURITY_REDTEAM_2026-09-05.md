# Red-team / audit sécurité xArtists — 2026-09-05

**Scope:** front GH Pages, doctrine, Guardian, SCs repo (`agents-marketplace`, `nft-marketplace`, RWA, bridge, treasury), secrets surface, API MultiversX.  
**Méthode:** revue code adversariale (attaque) + probe API mainnet + recoupement audits antérieurs.  
**Verdict:** **GO_DEMO** · **NO-GO** fonds utilisateurs / live trading / claims SC.

---

## 0. Résumé exécutif

| Question | Réponse |
|----------|---------|
| Peut-on drainer des fonds via les SC produit aujourd’hui ? | **Non** — adresses listées = comptes **vides** (`codeHash: null`, balance 0) |
| PEM / seed dans le frontend ou git ? | **Non** (scan front OK) |
| Trading live activable par un user ? | **Non** si `DEMO_MODE` + `LIA_LIVE_TRADING=0` + gates |
| Risque principal restant | **Déploiement** prématuré vers adresses vides + **social** (phishing WC) + **agents listing sans escrow** |

---

## 1. Probe mainnet (2026-09-05)

| Adresse (`data/contracts.json`) | codeHash | balance |
|---------------------------------|----------|---------|
| marketplace `…879yj7sj8354t` | **null** | 0 |
| nft_staking `…2xyj7sqxr8cl` | **null** | 0 |
| tro_governance `…4nyj7s6e0ca8` | **null** | 0 |
| agents_marketplace | **null** (jamais déployé) | — |

**Attaque « envoyer EGLD au marketplace »** : perte utilisateur (adresse non-contract), **pas** d’exploit SC.  
**Mitigation UI :** bloquer tout bouton Buy/List live tant que `codeHash` null (`integrityGates.ts`).

---

## 2. Matrice d’attaque (essayer de « hacker »)

### 2.1 Secrets & keys

| Vecteur | Résultat | Mitigation |
|---------|----------|------------|
| Chercher PEM / mnemonic dans `apps/frontend` | **Échec** | Doctrine + CI secrets scan |
| Exfiltrer `LIA_WALLET_PEM` via Pages | **Échec** | Secret GH Actions / Vellum only |
| Spoof Connect en wallet LIA ops | **Bloqué** (doctrine) | Ne jamais Connect LIA dans dApp user |
| Phishing WalletConnect domain | **Résiduel** | Allowlist Cloud WC = `neltud.github.io` |

### 2.2 Smart contracts (code repo)

#### agents-marketplace

| Vecteur | Analyse | Sévérité |
|---------|---------|----------|
| `claimFees` non-owner | `require_owner` → revert | Mitigé |
| Double claim | fees zeroed **avant** transfer | Mitigé CEI-ish |
| Reentrancy buy | `active=false` avant `direct_egld` | Mitigé CEI |
| Fee > 100% | `MAX_FEE_BPS=1000` (10%) | Mitigé |
| **List sans actif** | Listing **métadonnée only** — acheteur paie, **pas d’escrow NFT/agent** | **Élevé produit** (rug listing) |
| Pause bypass | endpoints check `paused` | Mitigé |
| Ownership hijack | 2-step `transferOwnership` + `acceptOwnership` | Mitigé |
| Upgrade arbitrary | `upgrade` → `require_owner` | Mitigé storage owner |

**Note design :** `buyAgentAction` = paiement EGLD au seller + fee SC. La **livraison** agent (accès API / NFT) est **hors chaîne**. Attaque économique = seller malveillant, pas bug Solidity/Rust classique.

#### nft-marketplace

| Vecteur | Analyse | Sévérité |
|---------|---------|----------|
| Buy sans NFT en escrow | Doit vérifier `list` payable ESDT NFT | Code attend transfer NFT — **re-vérifier list endpoint au deploy** |
| Bid refund | `refund_bid_if_any` avant nouveau bid | Mitigé (redeploy obligatoire si vieux wasm) |
| Fee + royalty > 100% | Caps + require somme | Mitigé code |
| Accept bid non-seller | `only seller` | Mitigé |

#### rwa-escrow-bridge

| Vecteur | Analyse | Sévérité |
|---------|---------|----------|
| `resolveDispute` | **Owner only** = centralisation | Moyen gouvernance |
| Refund avant deadline | owner **ou** après deadline | Acceptable + documenter |
| Double release | status muté avant transfer | Mitigé |

#### btc-bridge

| Vecteur | Analyse | Sévérité |
|---------|---------|----------|
| Mint sBTC sans relayer | Quorum signatures + nonce | Mitigé si relayers honnêtes |
| `claimSbtc` | **Accounting only** — pas de mint ESDT encore | **Élevé si user croit claim = token** |
| Collusion relayers | Trust quorum | Documenter experimental |

### 2.3 Frontend / demo

| Vecteur | Analyse | Mitigation |
|---------|---------|------------|
| XSS intent NL | React text default | Pas de `dangerouslySetInnerHTML` |
| Fake success TX | Doctrine anti-setTimeout | Interdit |
| localStorage packs = ownership | Paper only | My Packs on-chain vs paper séparé |
| Amount float | Atomic string + BigInt | Obligatoire TX builder |
| CSRF / API Guardian | Bearer + paper default | Offline fallback deny remote |

### 2.4 Ops / supply chain

| Vecteur | Mitigation |
|---------|------------|
| Actions workflow deploy SC | Secret PEM, pas loggé |
| Dépendance npm malicious | `npm ci` + lock ; audit périodique |
| Pages compromised | repo private ops + 2FA GH |

---

## 3. Ce qui est **déjà** solide

- Pause, fee cap, CEI pattern buy, claimFees owner, ownership 2-step
- `DEMO_MODE = true`, live trading off
- Pas de clé privée dans le bundle
- Audits antérieurs : `SECURITY_AUDIT_SC.md`, `AUDIT_SECURITY_2026-08-28.md`, `GO_LIVE_SECURE.md`
- Gates `lia.security.go_live_gates` (codeHash, no pem, chain)

---

## 4. Actions de consolidation (P0 → P2)

### P0 — avant tout dépôt user

1. **Ne jamais** pointer UI Buy vers adresse `codeHash null`
2. Deploy **devnet** → blackbox → **mainnet** + `verify_marketplace_codehash`
3. Multisig / 2-step owner = LIA ops, pas hot wallet trading
4. WalletConnect domain allowlist strict
5. External audit **avant TVL significative**

### P1 — durcissement produit

1. Agents : lier buy à **NFT pack** ou voucher on-chain (escrow / claim token)
2. Bridge BTC : label **experimental**, pas de fonds user
3. RWA disputes : timelock + multi-sig resolver
4. Content-Security-Policy headers sur host (si custom domain)
5. Rate-limit Guardian API + HMAC intents

### P2

1. Bug bounty scoped post-deploy
2. Monitoring anomalie fee claim / pause events
3. Formal verify CEI paths (optionnel)

---

## 5. Intégrité front (livré avec cet audit)

- `apps/frontend/src/lib/integrityGates.ts` — `assertLiveContract`, `isDemoLocked`
- Doc ops : ce fichier + `docs/GO_LIVE_SECURE.md`

---

## 6. Sign-off

| Mode | Statut |
|------|--------|
| Demo paper public | **APPROVED** |
| SC live user funds | **REJECTED** until codeHash + blackbox |
| LIA auto-trading | **REJECTED** until gates + micro-proof |
| Bridge / RWA user funds | **REJECTED** experimental |

*Cet audit n’est pas un audit externe certifié. Il ne remplace pas un audit cabinet avant TVL.*
