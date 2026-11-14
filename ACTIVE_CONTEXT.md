# ACTIVE_CONTEXT — xArtists / xOrus

## Mise à jour opératoire — 14 novembre 2026 (~05:45 UTC)

**Ce bloc remplace les chiffres et les statuts des instantanés plus anciens ci-dessous.** Toute décision doit relire les endpoints frais. Aucune CI, aucun push docs, aucune transaction pilote n'autorise automatiquement le commerce.

### Probe live (14 nov)

- **Site publié** : [xartists.art/build-info.json](https://xartists.art/build-info.json) → `release_version=0.138.0`, `source_sha=ccf25e514370ca571797416277cd6532a0e10ad4`, `lia_live_trading=false`, `public_route_count=140`, `built_at=2026-11-13T21:39:48.598Z`. Evidence read-only multi-modules (commit `ccf25e5`) est la base de ce build public.
- **API** : [health](https://xartists-access-api.onrender.com/health) → `ok=true`, `lia_live_trading=0`, `mint_live_enabled=false`, `mint_dry_run=true`, `studio_media_upload=off`, Stripe/MoonPay **off**, `paybox_checkout_enabled=false`, `walletless_account_session_enabled=false`, `xorus_private_analysis_enabled=false`, `auction_enabled=false`, `tro_solana_bridge=off`.
- **Studio / IPFS** : [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) → **HTTP 503**. Upload reste OFF. Migrations 004/005/006 non certifiées en prod.
- **Sécurité récente (13 nov, main)** : refus d'éligibilité wallet forgée (URL/localStorage) ; mailbox schema isolée PG ; soft-launch nav 15 modules / 44 routes préservées ; SOL receipt read-only ; Jupiter signing unaudité **fail-closed** ; mail module gardé (création disabled).
- **Marketplace** : preuve historique listing #2 (0,25 EGLD) seulement. **0 listing actif** au dernier probe on-chain. Parcours listing signé → achat → receipt **non certifié** pour un nouveau cycle (#428).
- **Docs poussés ce jour** : [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md), [`docs/STATUS.md`](docs/STATUS.md) alignés sur ce probe.

### Verdict net

| Surface | Verdict |
| --- | --- |
| Site / musée / exploration / xOrus paper | **GO_LIVE** |
| Trading autonome LIA/xOrus | **NO-GO** |
| Mint live / fiat (Stripe, MoonPay, PayBox checkout) | **NO-GO** |
| Studio upload IPFS | **NO-GO** (503) |
| Buy/Bid/Offer public | **NO-GO** jusqu'à preuve cycle complet |

### Prochain ordre de travail (inchangé, priorisé)

1. Certifier Reown/xPortal + wallet utilisateur signataire (#506).
2. Prouver PostgreSQL Studio runtime → backup/restore → migrations → CID/Pinata readback.
3. Démontrer **nouveau** listing signé artiste → achat → receipt Explorer (#428).
4. Compte email + droits xOrus privés serveur (#548).
5. Un seul rail paiement après webhooks/révocation/légal.

**Sécurité :** aucun changement de flag financier, signature/mint, trade, clé privée, DNS, paiement ou migration de production n'est autorisé par une CI ou par ce document.

---

## Archive — 13 novembre 2026 (09:09 UTC)

Conservée pour traçabilité. Les sondes du **14 novembre** ci-dessus priment.

- Site 0.137.0 / SHA `72c391b…` (obsolète vs 0.138.0).
- xOrus analysis v2 : 48 bougies, verdict ABSTAIN, paper_only.
- Cache xOrus #549 fusionnée.
- Marketplace #550 fusionnée (préparation UI, pas ouverture Buy public).
- Orders/mint tables postgres ready ≠ livraison NFT.
- OVH image CI-verte, **pas de bascule DNS**.

---

## Situation réelle et parcours simples

| Parcours / module | État vérifié ou limite |
| --- | --- |
| Accueil, musée, exploration NFT, xOrus | Dapp publique, **140** routes. Consultation sans wallet ; xOrus **paper**, aucun trading automatique |
| Marketplace | Grille découverte ; vente préparée ; **cycle listing→achat→receipt non certifié** pour un nouveau listing |
| Studio et sculpture 3D | Schéma GLB en code ; **prod non migrée** ; diagnostic 503 → upload interdit |
| Comptes utilisateurs | Exploration sans wallet ≠ compte email prod ≠ wallet signataire |
| Fiat | Stripe/MoonPay off ; PayBox checkout disabled |
| Infrastructure | Pages + API Render ; OVH parallèle non basculé |

## Priorités ordonnées, avec conditions d'arrêt

1. **Données Studio** — DB réelle liée à l'API, backup/restore, 004/005/006, CID retour.
2. **xPortal** — allowlist Reown `xartists.art` + QR navigateur réel (#506).
3. **Transactions** — SC, codeHash, propriété NFT, listing signé + livraison on-chain (#428).
4. **Comptes / fiat** — JWT email, SIWX, webhooks, révocation ; pas de faux droit NFT invité.
5. **OVH** — déploiement parallèle puis recette de reprise avant bascule API publique.

## Garde-fous maintenus — NO-GO commercial / trading

- `build-info.json.lia_live_trading=false` confirmé (14 nov).
- PayBox **fail-closed** sur checkout.
- Pas de recharge / swap LIA Ops. Incident **30 oct 2026** = référence sécurité.
- Treasury dest `null` : pas de `claimFees`.
- Fenêtre historique Upbit/Bithumb EGLD : relire notices officielles ; **pas** un auto-GO.

Voir [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md), [`docs/STATUS.md`](docs/STATUS.md), [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md), [`docs/security/launch-gates.md`](docs/security/launch-gates.md).
