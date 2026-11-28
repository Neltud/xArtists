# SPRINT GO-LIVE MAX — 28 novembre 2026

## 1. État de vérité (mesuré)

| Surface | Valeur | Interprétation |
|---------|--------|----------------|
| Pages | 0.139.0 · `2d4138cb` · 140 routes · `lia_live_trading=false` | Discovery **GO** |
| API Render | `8b6fae84` · checkout/mint/auction **off** · PayBox prod sans checkout | Commerce **NO-GO** |
| xOrus | paper / ABSTAIN / agents observation only | Pas de trading live |
| Studio store | table_ready=false / upload off | Backend média fermé |
| MultiversX | Operational (PulsAPI 27 Nov) · Supernova 600ms live depuis sept. | Infrastructure chaîne saine |

## 2. Ce qui a été livré le 27 novembre (déjà sur main)

- #649 Studio Neon isolé + sessions persistantes + JWT fort
- #647 architecture Global Pay multidevise (planning-only, rails fermés)
- #645 marketplace listing direct depuis wallet + diagnostics vendeur + royalties FR
- #646 estimation prix préparatoires Studio
- #641 refactor parcours Studio/Wallet/Agents/DAO compacts
- #642 vendeurs publics + découverte listings mainnet + reçu de dépôt
- #637 observations mainnet MultiversX + Solana sur xOrus

## 3. PRs ouvertes prioritaires (à traiter maintenant)

| PR | Décision recommandée | Condition |
|----|----------------------|-----------|
| **#648** UX Studio sans jargon + cotations tête xOrus | **Merge** si CI verte | Aucun backend média activé |
| **#651** routing API Neon Studio dédiée | **Merge** après #648 | `VITE_STUDIO_API_BASE` non définie par défaut |
| **#644** custody withdrawals pendant pause | **Merge** après attestation tests VM | Aucun upgrade SC auto |
| **#643** security audit mainnet (draft) | Review only | Pas de déploiement |
| **#591** release 0.140.0 | Attendre tip stable post-#648/#651 | Bot |
| **#459** WC provider 6.1.5 | Review + smoke pairing après #506 | Breaking possible |
| Drafts xOrus / Neon / RWA / Pulse | Garder draft | Hors chemin critique |

## 4. Ordre d’attaque ops (humain — non contournable)

1. **#506** — Dashboard Reown Cloud  
   - Allowlist exacte : `https://xartists.art` + `https://www.xartists.art`  
   - Smoke Android Chrome ou iOS : Wallet → xPortal → QR → approve → adresse visible → navigation /market + /museum sans perte de session  
   - **Aucune signature d’achat**  
   - Rapport collé sur l’issue (OS, version xPortal, OK/KO)

2. **#428** — Cycle list/buy (après #506 OK)  
   - Wallet A artiste ≠ LIA ops · Wallet B acheteur  
   - Listing signé · Buy value exacte · 2 hashes Explorer · NFT possession B

3. **#341** — Preuve réception `hello@xartists.art`

4. Studio migrations 004→005 après backup (quand store isolé stable)

## 5. GO commercial — critères non négociables

- Smoke Sentinel réel (paiement + IPN RSA)  
- My Packs NFT prouvé sur Explorer  
- `paybox_checkout_enabled` et `mint_live_enabled` uniquement après preuves  
- LIA reste paper (`VITE_LIA_LIVE_TRADING=0`) jusqu’à décision propriétaire explicite

## 6. Veille technologique (28 Nov 2026)

- **MultiversX Supernova** : 600 ms rounds en mainnet depuis ~10 sept 2026 ; cross-shard ~2.4 s. Contrats doivent préférer `get_block_timestamp_millis()` pour logique intra-seconde.
- **xPortal** : intégration Pegaroute (routing multi-provider) live pour swaps. Provider WC v6.2.0 améliore init concurrente et état pendant QR.
- **Reown AppKit** : migration WalletConnect Modal → AppKit Core recommandée ; Universal Connector pour QR chain-agnostic.
- **Market** : MultiversX mcap ~$73 M (27 Nov) ; revenus protocoles dominés par xExchange + XOXNO. Stablecoins on-chain quasi nuls (données DefiLlama).
- **xArtists position** : listé dans l’écosystème MultiversX Marketplaces. Différenciation = art physique + numérique + Studio + xOrus paper + packs Genesis (110/75/50 € catalogue, non encaissés).

## 7. Décision du chef d’orchestre

**Pas de GO total aujourd’hui.**  
Discovery et UX avancent. Le commerce reste fail-closed par design.  
Prochaine action exécutable sans risque : merge #648 + #651 (CI verte) + allowlist Reown par l’opérateur.
