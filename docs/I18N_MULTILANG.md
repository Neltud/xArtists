---
hidden: true
noIndex: true
---

# Multilingue xArtists

## Langues supportées

| Code | Langue            | Direction |
| ---- | ----------------- | --------- |
| `fr` | Français (défaut) | LTR       |
| `en` | English           | LTR       |
| `es` | Español           | LTR       |
| `de` | Deutsch           | LTR       |
| `ru` | Русский           | LTR       |
| `uk` | Українська        | LTR       |
| `zh` | 中文                | LTR       |
| `ar` | العربية           | RTL       |

## Fichiers

* `apps/frontend/src/i18n/types.ts` — type `Lang`, liste `LANGS`
* `apps/frontend/src/i18n/dictionaries.ts` — clés UI (`nav.*`, `cc.*`, `home.*`, `slot.*`, …)
* `apps/frontend/src/i18n/I18nContext.tsx` — `t(key)`, détection navigateur, `localStorage`

## Usage dans un composant

```tsx
import { useI18n } from '../i18n/I18nContext'

const { t, lang, setLang } = useI18n()
return <h1>{t('home.title')}</h1>
```

## Ajouter une clé

1. Ajouter la même clé dans **fr, en, es, ru, uk, zh, ar** dans `dictionaries.ts`
2. Utiliser `t('ma.cle')` — jamais de texte brut pour les libellés UX principaux
3. Fallback : `lang` → `en` → `fr` → clé brute

## Sélecteur langue

Le sélecteur de langue reste visible **sur ordinateur**. Sur **mobile (≤840 px)**, il ne figure **pas** dans la barre supérieure : pour changer de langue, ouvrir ☰ puis utiliser « Langue », **en premier** dans le menu. Ce sélecteur utilise `setLang` ; le choix est mémorisé via `localStorage` (`xartists_lang`) et reflété dans `?lang=`. Sans préférence enregistrée, la langue du navigateur est détectée. Après changement : `document.documentElement.lang` + `dir` (RTL arabe). Le réglage clair/sombre reste dans le menu mobile.

## Hors scope pour l’instant

* Traduction des **données on-chain** / noms NFT
* Traduction auto des **signaux LIA** paper (anglais technique OK)
* Pages légales complètes (à faire par juriste par locale)

## Checklist pages

* [x] Nav / CC / Slot / common
* [x] Home (`home.*`)
* [ ] Marketplace formulaires (en cours)
* [ ] Studio / legal long form
