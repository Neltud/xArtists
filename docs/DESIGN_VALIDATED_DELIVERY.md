# Livraison design validé — xArtists

**Date :** 2026-10-18  
**Référence Sites :** https://xartists.loftypearl128.chatgpt.site (accès login ChatGPT — non inspectable depuis CI)  
**Dépôt :** https://github.com/Neltud/xArtists

---

## 1. Direction artistique

| Token | Valeur |
|-------|--------|
| Fond | `#10120f` |
| Accent | `#cdf58b` (vert acide) |
| Surfaces | graphite `#1a1d18` |
| Texte | `#f2f5ee` |

Fichiers : `apps/frontend/src/styles/soul-tokens.css`, `index.css`  
`prefers-reduced-motion` respecté (durée → quasi 0).

CTA primaire = fond accent / texte graphite. Logo header = pastille `#cdf58b`.

---

## 2. Architecture navigation

**5 espaces** (`routeRegistry.ts`) :

| Espace | Hub |
|--------|-----|
| Explorer | `/`, `/museum`, `/market` |
| Créer | `/studio` |
| Intelligence | `/agents`, `/command-center`, `/lia` |
| Finance | `/staking`, `/lp`, `/dao` |
| Mon espace | `/wallet`, `/portfolio`, `/my-packs` |

- Alias legacy centralisés (`/marketplace` → `/market`, `/packs` → `/agents`, …)
- **404 réelle** : `NotFoundPage` (plus de redirect silencieux vers `/`)
- Bottom nav mobile : registry, min-height 52px

---

## 3. Musée immersif ✅

| Feature | Statut |
|---------|--------|
| Fullscreen (API + touche F) | ✅ |
| Prev / next artwork + téléport + orientation | ✅ |
| Dual-touch look (lookPointerId isolé) + VirtualJoystick | ✅ |
| FPS ↔ Avatar (touche V) | ✅ |
| Reset (R) · ZQSD · hints FR/EN | ✅ |
| Chrome graphite / acid-green | ✅ |

Fichiers : `MuseumWebGLHallLive.tsx` (impl via `MuseumWebGLHallImpl`), `VirtualJoystick.tsx`, `MuseumPage.tsx` (modes i18n).

---

## 4. xPortal / WalletConnect

Cycle :
1. `init()`
2. `connect()` → `{ uri, approval }`
3. `login({ approval })` si exposé, sinon `approval()`
4. `getAddress()` → session UI

- QR via event `xartists-wc-uri` (génération locale)
- **Plus de Firebase** `maiar.page.link`
- `openXPortalApp(uri)` uniquement sur geste utilisateur
- Métadonnées WC : `dappOrigin()` (origine réelle)
- Erreurs : refus / expiration / annulation mappées

Fichiers : `lib/xportalWc.ts`, `config/sdkDapp.ts`

**Non vérifié ici :** scan QR réel sur iPhone/Android + approbation dans l’app xPortal (nécessite device).

---

## 5. Multilingue ✅ (passe dense)

Langues : `fr | en | es | de | ru | uk | zh | ar` (RTL via `dir` dans `I18nContext`).

| Zone | Couverture |
|------|------------|
| Nav / home / packs / sale | FR/EN complets · ES/DE/RU/UK/ZH/AR solides |
| Musée (immersion, modes, hints) | FR/EN + overrides multi-lang |
| Wallet (connect, erreurs) | FR/EN + ES/DE/RU/UK/ZH/AR |
| Checkout + legal | FR/EN complets · DE/ES/ZH/RU/UK/AR (UI + titres ; corps légaux EN fallback) |

Fallback : langue → EN → FR → clé brute.

Fichiers : `dictionariesCore.ts`, `checkoutLegalKeys.ts`, `marketKeys.ts`, `I18nContext.tsx`.

---

## 6. Contrôles

| Contrôle | Statut |
|----------|--------|
| Build CI local | Non exécuté dans cet environnement agent |
| Routes + aliases (revue code) | ✅ |
| Tokens design (revue code) | ✅ |
| xPortal cycle (revue code) | ✅ |
| Musée immersif (revue code) | ✅ |
| i18n multi-lang (revue code) | ✅ |
| Tests unitaires existants | Non relancés |
| Téléphone / xPortal réel | ❌ Non effectué |
| Sites reference pixel-diff | ❌ Login ChatGPT bloquant |

---

## Fichiers principaux modifiés

- `styles/soul-tokens.css`
- `config/routeRegistry.ts`
- `config/sdkDapp.ts`
- `lib/xportalWc.ts`
- `App.tsx`
- `pages/NotFoundPage.tsx`
- `pages/MuseumPage.tsx`
- `components/Header.tsx`, `BottomNav.tsx`
- `components/museum/VirtualJoystick.tsx`
- `components/museum/MuseumWebGLHallLive.tsx`
- `i18n/dictionariesCore.ts`, `checkoutLegalKeys.ts`, `marketKeys.ts`
- Pages protocol (Home, Packs, Sale, CC, Market, Museum, LIA, TCA, Wallet, Staking, Studio, Portfolio, DAO, LP)

---

## Suite recommandée

1. `npm run build` + smoke routes sur preview
2. Test xPortal iOS/Android avec `openXPortalApp`
3. ~~Pass musée immersif~~ **fait**
4. ~~Enrichir i18n ES/DE/RU/UK/ZH/AR~~ **fait** (corps légaux longs encore en EN pour DE/ES/ZH/RU/UK/AR — second push dense possible depuis artifacts locaux)
5. Preuve produit P0 : 1 TX utilisateur (stake TRO / buy pack / bid listing #2) documentée dans `ONCHAIN_MICRO_PROOFS.md`
