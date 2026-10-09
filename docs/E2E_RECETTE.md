# Audit de Recette Opérationnelle (E2E)

**Cible :** https://neltud.github.io/xArtists/  
**Date audit code :** 2026-10-10  
**Verdict global :** **AMBER → GO conditionnel** (voir gaps)

---

## Test 1 — Guest / Web2.5

| Étape | Attendu | Statut code | Note live |
|-------|---------|-------------|-----------|
| Accès simplifié LoginModal | session sans wallet | ✅ code | Hard-refresh après deploy |
| Clé `xa_guest_*` localStorage | présente | ✅ CheckoutModal | À valider F12 navigateur |
| Checkout Fiat intention | état persisté | ✅ dual-rail | Webhook mint = ops Stripe (pas auto) |

**Verdict T1 :** PASS code · **manuel** requis sur Pages.

---

## Test 2 — DeFi Hub

| Étape | Attendu | Statut |
|-------|---------|--------|
| `#/command-center` → DeFi Hub | visible room hub + yield | ✅ |
| HF calculé | seuil 1.4 | ✅ `HF_MIN_SAFE` |
| Payload gas | base × 1.15 | ✅ `withGasMargin` |
| Slippage AshSwap | 0.5% + minOut + deadline | ✅ |
| Copier JSON | clipboard | ✅ try/catch (Safari peut demander permission) |

**Verdict T2 :** PASS code · signature xPortal = **user** (air-gap volontaire).

---

## Test 3 — WebGL pause

| Étape | Attendu | Statut |
|-------|---------|--------|
| `data-xartists-modal="1"` | pause RAF | ✅ bridge + event |
| `useWebglPauseWhen` | hook modales | ✅ |

**Verdict T3 :** PASS code · mesurer FPS en DevTools (manuel).

---

## Test 4 — News ticker

| Étape | Attendu | Statut |
|-------|---------|--------|
| ≥ 10 items JSON | seed + merge | ✅ après commit news ≥12 |
| Badge ● LIVE | pulse CSS | ✅ |
| Cron 3h | workflow | ✅ `news-cron.yml` |

**Avant fix :** live Pages avait **8** items → **FAIL**.  
**Après push seed 12 items + merge worker :** PASS attendu post-rebuild.

---

## Gaps avant « ouverture publique »

1. **Pages lag** — hard-refresh Ctrl+Shift+R après chaque deploy
2. **Slot REAL** — encore fragile (payable / args) selon STATUS.md
3. **Packs mint** — paper / BIENTÔT sur accueil
4. **Soul** — deep-link only
5. **Fiat webhook** — secrets Stripe ops, pas dans le front

---

## Recommandation

- **Pas encore green total** pour marketing large sans checklist manuelle (guest key, FPS, 1 TX user).
- **Oui** pour soft-launch communauté + dossier presse **si** disclaimer MiCA + paper LIA + 1 buy/stake prouvés explorer restent visibles.

Prochaine étape suggérée : **dossier presse / annonce MultiversX** (honest status) **après** hard-refresh + checklist T1–T4 manuelle 10 min.
