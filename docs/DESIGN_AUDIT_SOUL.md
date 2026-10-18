# Design audit — xArtists × soul.io

**Date :** 2026-10-18  
**Objectif :** aligner l’UI/UX et les textes sur un langage *protocol-grade* (clair, sobre, stats-first), inspiré de [soul.io](https://www.soul.io/) (cross-lending / unify liquidity), sans copier le branding.

---

## 1. Lecture du style soul.io (référence)

| Dimension | soul.io |
|-----------|---------|
| **Hero** | Une promesse nette (« Unify Liquidity & Borrowing Power ») + sous-ligne actionnable |
| **Stats** | TVL / volume / users en tête, chiffres gros, labels discrets |
| **CTA** | Un primaire fort (« Access the app »), peu de concurrence visuelle |
| **Hiérarchie** | Beaucoup d’air, typo large, peu de jargon ornemental |
| **Tone** | Protocol / infrastructure — pas musée ni gaming |
| **Couleur** | Fond sombre ou neutre, accents sobres, contrastes élevés |
| **Copy** | Anglais produit + explications courtes sous chaque métrique |

---

## 2. État actuel xArtists (constats)

### Forces
- Identité **musée / atelier / packs** différenciante (Pulse · Yield · Sentinel).
- i18n déjà structuré (`fr` source, `en` + fallbacks es/de/zh…).
- Modules riches : Command Center, packs, marketplace, LIA.

### Écarts vs soul.io
1. **Densité** — trop de panneaux, jargon (holographique, dôme, salle) avant la valeur métier.
2. **Hero** — « Entre dans les pièces » est poétique mais peu B2B / protocol.
3. **Stats absentes en tête** — pas de bandeau type TVL packs / holders / signaux.
4. **CTAs multiples** — concurrence galerie / LIA / TCA / packs.
5. **i18n incomplet** — ES/DE/RU/UK/ZH/AR souvent *shallow* (`...en` + 3–5 clés) ; modules packs/checkout/audit partiels hors FR/EN.
6. **Hardcoded strings** — SalePage, certains panels, prix, labels agents encore hors dictionnaire.
7. **Typo & spacing** — style « glass / violet glow » vs soul « clean protocol ».

---

## 3. Principes de refonte (design system « Soul-aligned »)

### 3.1 Tokens (voir `apps/frontend/src/styles/soul-tokens.css`)
- Fond : `#0a0a0f` / `#111118`
- Surface : `#16161f` + bordure `rgba(255,255,255,0.08)`
- Texte : primary `#f4f4f5`, secondary `#a1a1aa`, muted `#71717a`
- Accent unique (xArtists) : ambre packs `#f59e0b` + violet secondaire discret `#8b5cf6`
- Rayons : 12–16px (moins « pill gaming »)
- Ombre : quasi nulle ; hiérarchie par contraste et bordure

### 3.2 Layout pages
1. **Top stats strip** (3–4 KPI)  
2. **Hero 1 promesse + 1 sous-ligne + 1 CTA primaire + 1 secondaire**  
3. **Grille modules** (max 3 colonnes, cards égales)  
4. **Disclaimer** une ligne, toujours visible sur flux packs / checkout

### 3.3 Tone of voice (FR + EN)
| Avant (musée) | Après (protocol) |
|---------------|------------------|
| Entre dans les pièces | Accès packs & salles ops |
| Mur holographique | Tableau de bord holder |
| Fun = crédits virtuels | Mode paper — aucun fonds client |
| Pack GOLD full suite | Pulse — signaux HF & Command Center complet |

**Règles copy :**
- FR : espaces insécables avant `: ? ! ;`
- Pas de promesse de rendement
- Toujours préciser *paper / non-custodial* sur les flux agents

---

## 4. Plan i18n — « bien traduire toutes les pages »

### Couverture cible
| Module | FR | EN | ES/DE | ZH |
|--------|----|----|-------|-----|
| Nav + home + onboard | ✅ | ✅ | à compléter | à compléter |
| Packs (noms, taglines, entitlements) | ✅ | ✅ | partial → full | partial → full |
| Checkout + legal | ✅ | ✅ | partial | partial |
| Command Center / LIA | ✅ | ✅ | shallow | shallow |
| Marketplace / RWA | ✅ | ✅ | shallow | shallow |
| SalePage / hardcodes | ❌ → ✅ | ❌ → ✅ | — | — |

### Fichiers prioritaires
1. `dictionariesCore.ts` — home, nav, onboard, CC (refonte tone soul)
2. `agentPacks.ts` + clés `packs.*` dédiées
3. `checkoutLegalKeys.ts` — alignement prix 110 / 75 / 50
4. `SalePage.tsx` — sortir les strings vers i18n
5. ES/DE : au minimum nav + home + packs + checkout (pas seulement `...en`)

---

## 5. Roadmap d’implémentation

| Phase | Livrable |
|-------|----------|
| **P0** | Tokens CSS + audit (ce doc) |
| **P1** | Refonte copy FR/EN core (home, onboard, nav, packs) |
| **P2** | Stats strip + hero protocol sur Home |
| **P3** | SalePage + CheckoutModal i18n + prix alignés |
| **P4** | ES/DE packs + checkout complets |
| **P5** | Pass UI Command Center (moins glow, plus table/stats) |

---

## 6. Non-objectifs
- Ne pas supprimer l’identité packs Pulse / Yield / Sentinel.
- Ne pas cloner le logo ou le wording exact de soul.io.
- Ne pas promettre APY ou performance.

---

## 7. Prochaine action code
Appliquer P0–P1 : tokens + dictionnaires core + clés packs FR/EN protocol-grade.
