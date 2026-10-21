import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ExperienceState = {
  lang: string
  setLang: (lang: string) => void
  search: string
  setSearch: (q: string) => void
}

const ExperienceContext = createContext<ExperienceState | null>(null)

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState('fr')
  const [search, setSearch] = useState('')
  const value = useMemo(() => ({ lang, setLang, search, setSearch }), [lang, search])
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
}

export function useExperience(): ExperienceState {
  const ctx = useContext(ExperienceContext)
  if (!ctx) throw new Error('useExperience outside ExperienceProvider')
  return ctx
}
