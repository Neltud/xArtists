import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DICTS } from './dictionaries'
import { phrase, setPhraseLanguage, PhraseLanguageContext } from './phraseRuntime'
import { LANGS, type Lang } from './types'

const STORAGE = 'xartists_lang'

type Api = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
}

const Ctx = createContext<Api | null>(null)

function isLang(v: string | null): v is Lang {
  return !!v && v in DICTS
}

function detect(): Lang {
  try { const urlLang=new URLSearchParams(window.location.search).get('lang');if(isLang(urlLang))return urlLang }catch{}
  try {
    const saved = localStorage.getItem(STORAGE)
    if (isLang(saved)) return saved
  } catch {
    /* */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'fr').toLowerCase()
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('de')) return 'de'
  if (nav.startsWith('ru')) return 'ru'
  if (nav.startsWith('uk')) return 'uk'
  if (nav.startsWith('zh')) return 'zh'
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('en')) return 'en'
  return 'fr'
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`,
  )
}

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang || detect())

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE, l)
      const url=new URL(window.location.href);url.searchParams.set('lang',l);window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash)
    } catch {
      /* */
    }
  }, [])

  setPhraseLanguage(lang)

  const dir = LANGS.find(x => x.id === lang)?.dir || 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const d = DICTS[lang] || DICTS.fr
      // Fallback: current lang → English → French → raw key
      const raw = d[key] || DICTS.en[key] || DICTS.fr[key] || key
      return interpolate(phrase(raw, lang), vars)
    },
    [lang],
  )

  const api = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir])

  return <Ctx.Provider value={api}><PhraseLanguageContext.Provider value={lang}>{children}</PhraseLanguageContext.Provider></Ctx.Provider>
}

export function useI18n(): Api {
  const c = useContext(Ctx)
  if (!c) {
    return {
      lang: 'fr',
      setLang: () => undefined,
      t: (k: string, vars?: Record<string, string | number>) =>
        interpolate(DICTS.fr[k] || DICTS.en[k] || k, vars),
      dir: 'ltr',
    }
  }
  return c
}
