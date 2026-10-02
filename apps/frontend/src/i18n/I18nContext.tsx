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
import { LANGS, type Lang } from './types'

const STORAGE = 'xartists_lang'

type Api = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const Ctx = createContext<Api | null>(null)

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE) as Lang | null
    if (saved && DICTS[saved]) return saved
  } catch {
    /* */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'fr').toLowerCase()
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('ru')) return 'ru'
  if (nav.startsWith('uk')) return 'uk'
  if (nav.startsWith('zh')) return 'zh'
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('en')) return 'en'
  return 'fr'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detect())

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE, l)
    } catch {
      /* */
    }
  }, [])

  const dir = LANGS.find(x => x.id === lang)?.dir || 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const t = useCallback(
    (key: string) => {
      const d = DICTS[lang] || DICTS.fr
      return d[key] || DICTS.en[key] || DICTS.fr[key] || key
    },
    [lang],
  )

  const api = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useI18n(): Api {
  const c = useContext(Ctx)
  if (!c) {
    return {
      lang: 'fr',
      setLang: () => undefined,
      t: (k: string) => DICTS.fr[k] || k,
      dir: 'ltr',
    }
  }
  return c
}
