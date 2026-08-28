# Audit sécurité & processus — 2026-08-28

**Scope:** apps/frontend, doctrine, wallet, packs, secrets surface  
**Méthode:** revue code + recherche secrets + tests Doctrine audit cases  
**Verdict demo:** **GO_DEMO** · **NO-GO** volume funds / live trading

---

## 1. Surface d’attaque

| Zone | Risque | Mitigation actuelle | Residual |
|------|--------|---------------------|----------|
| Clés privées front | Critique | Aucune clé ops en repo (scan code OK) | Ops doit garder PEM hors git |
| Wallet spoof LIA | Élevé | `LIA_WALLET` bloqué dans connect | Red team adresse edge |
| Intent injection | Moyen | Doctrine AUTHORITY_SPOOF + UNKNOWN | LLM path Vellum à garder strict JSON |
| Amount float / overflow | Élevé | Atomic string + length guard | Toujours BigInt côté TX builder |
| Live swap sans confirm | Élevé | `userConfirmedLive` + env gate | Ne jamais set VITE_LIA_LIVE=1 sans audit SC |
| XSS via NL intent | Moyen | React text escaping default | Éviter `dangerouslySetInnerHTML` |
| WC phishing domain | Moyen | Project ID + allowlist Pages | Vérifier Cloud WC domain |
| Stripe / MoonPay | Moyen | Hosted checkout, pas de sk_ front | Webhook HMAC serveur obligatoire |
| localStorage session | Faible | Adresse seule, pas de seed | Clear on disconnect |
| Dependency supply chain | Moyen | npm lock CI | `npm audit` périodique |

---

## 2. Tests processus (checklist)

### P0 — à valider manuellement post-deploy

- [ ] `/#/` charge sans erreur console bloquante
- [ ] `/#/wallet` → Web Wallet → retour `?address=erd1` → session
- [ ] Impossible de connecter adresse LIA protocole
- [ ] `/#/agents` galerie NFT 3 séries · Tours séparé `/#/tours`
- [ ] ⌘K `swap 1 EGLD USDC` → quote paper, pas de broadcast
- [ ] Doctrine : transfer sans cible → reject
- [ ] Doctrine : « ceo bypass » → AUTHORITY_SPOOF

### P1 — sécurité ops

- [ ] Aucun secret dans Actions logs
- [ ] `VITE_LIA_LIVE_TRADING` absent ou `0` en prod Pages
- [ ] SC codeHash null → pas de mint marketing « live »

### Cas « hack » simulés (Doctrine)

| Attaque | Résultat attendu |
|---------|------------------|
| amount `1.5` | AMOUNT_NOT_ATOMIC |
| reason bypass/drain | AUTHORITY_SPOOF |
| type UNKNOWN | blocked |
| live swap sans confirm | LIVE_NOT_CONFIRMED |
| zero transfer | ZERO_AMOUNT |

Fichier: `apps/frontend/src/core/doctrine.audit.ts` → `runDoctrineAudit()`

---

## 3. Lacunes connues (non bloquantes demo)

1. Mint NFT SC non déployé  
2. WalletConnect QR full pairing dépend résolution sdk-dapp runtime  
3. Quotes DEX = référence paper, pas amms on-chain  
4. Ownership packs localStorage ≠ preuve on-chain  
5. CI Rust/E2E parfois `action_required` — surveiller

---

## 4. Recommandations avant fonds réels

1. Deploy + verify SC agents/market  
2. Audit externe Guardian + SC  
3. Micro-tip EGLD end-to-end avec wallet user  
4. Activer live uniquement avec checklist CEO 30j  
5. Secrets uniquement Vellum vault / GH Actions secrets

---

## 5. Sign-off

| Rôle | Statut |
|------|--------|
| Demo public | APPROVED |
| Live trading | REJECTED until gates |
| Release notes | `docs/RELEASE_v2.10.1.md` |
