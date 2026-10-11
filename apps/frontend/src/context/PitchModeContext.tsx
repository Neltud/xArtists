/**
 * Mode Pitch B2B — masque logs/debug bruts, profil démo « Galerie Partenaire ».
 * Toggle UI uniquement ; ne change jamais LIA_LIVE_TRADING ni les gates on-chain.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'xartists.pitchMode'

export type PitchPartnerProfile = {
  label: string
  tagline: string
  egldBalance: number
  troBalance: number
  usdcBalance: number
  nftCount: number
  strategy: string
}

/** Profil démo soigné pour pitchs B2B (pas de soldes nuls / placeholders bruts). */
export const PITCH_PARTNER_PROFILE: PitchPartnerProfile = {
  label: 'Galerie Partenaire',
  tagline: 'Collection phygital · paper trading · packs Pulse · Yield · Sentinel',
  egldBalance: 12.48,
  troBalance: 48_500,
  usdcBalance: 1_250,
  nftCount: 7,
  strategy: 'YIELD · paper',
}

type PitchModeContextValue = {
  pitchMode: boolean
  setPitchMode: (v: boolean) => void
  togglePitchMode: () => void
  partner: PitchPartnerProfile
  /** true quand on doit masquer logs / erreurs brutes / soldes 0. */
  hideDebug: boolean
}

const PitchModeContext = createContext<PitchModeContextValue | null>(null)

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function PitchModeProvider({ children }: { children: ReactNode }) {
  const [pitchMode, setPitchModeState] = useState(false)

  useEffect(() => {
    setPitchModeState(readStored())
  }, [])

  const setPitchMode = useCallback((v: boolean) => {
    setPitchModeState(v)
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.pitchMode = v ? '1' : '0'
  }, [])

  const togglePitchMode = useCallback(() => {
    setPitchMode(!pitchMode)
  }, [pitchMode, setPitchMode])

  useEffect(() => {
    document.documentElement.dataset.pitchMode = pitchMode ? '1' : '0'
  }, [pitchMode])

  const value = useMemo(
    () => ({
      pitchMode,
      setPitchMode,
      togglePitchMode,
      partner: PITCH_PARTNER_PROFILE,
      hideDebug: pitchMode,
    }),
    [pitchMode, setPitchMode, togglePitchMode],
  )

  return <PitchModeContext.Provider value={value}>{children}</PitchModeContext.Provider>
}

export function usePitchMode(): PitchModeContextValue {
  const ctx = useContext(PitchModeContext)
  if (!ctx) {
    return {
      pitchMode: false,
      setPitchMode: () => {},
      togglePitchMode: () => {},
      partner: PITCH_PARTNER_PROFILE,
      hideDebug: false,
    }
  }
  return ctx
}
