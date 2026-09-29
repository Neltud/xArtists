import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { TUDURI_WORKS, ATELIER_EXPLORER } from '../config/tuduriAtelier'
import { getPageTheme } from '../config/pageThemes'
import { useBrainMood } from '../hooks/useBrainMood'
import { moodCssVars } from '../lib/brainStream'

/**
 * Ambient gallery + Corps visuel piloté par le Cerveau (mood Grok/LIA).
 * Theme route + --brain-* (lumière / couleur selon hype/crash).
 */
export default function ArtAtelierBackdrop() {
  const { pathname } = useLocation()
  const theme = useMemo(() => getPageTheme(pathname), [pathname])
  const brain = useBrainMood()

  const strip = useMemo(
    () => theme.panelIndices.map(i => TUDURI_WORKS[i] ?? TUDURI_WORKS[0]),
    [theme.panelIndices],
  )

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    Object.entries(theme.vars).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
    body.dataset.pageTheme = theme.id
    root.style.setProperty('--page-accent', theme.accent)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const vars = moodCssVars(brain)
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.dataset.brainMood = brain.mood
  }, [brain])

  return (
    <div
      className={`atelier-backdrop atelier-backdrop--${theme.id} pointer-events-none`}
      aria-hidden
      data-theme={theme.id}
      data-brain={brain.mood}
    >
      <div className="atelier-page-wash" />
      <div className="atelier-veil" />
      {/* Brain tint layer — Corps réagit au Cerveau */}
      <div
        className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
        style={{ background: 'var(--brain-tint, transparent)' }}
      />
      <div className="atelier-strip">
        {strip.map((w, i) => (
          <div
            key={`${theme.id}-${w.id}-${i}`}
            className={`atelier-panel atelier-panel--${i}`}
            style={{ backgroundImage: `url(${w.thumb})` }}
            title={`${w.name} · ${w.year}`}
          />
        ))}
      </div>
      <div
        className="atelier-orb atelier-orb--a"
        style={{ boxShadow: `0 0 80px 20px var(--brain-glow, transparent)` }}
      />
      <div
        className="atelier-orb atelier-orb--b"
        style={{
          background: `radial-gradient(circle, var(--brain-orb, #a78bfa) 0%, transparent 70%)`,
          opacity: 0.35,
          transition: `opacity var(--brain-speed, 1.6s) ease`,
        }}
      />
      <a
        href={ATELIER_EXPLORER}
        target="_blank"
        rel="noreferrer"
        className="atelier-credit pointer-events-auto"
        title={`Thème ${theme.label} · cerveau ${brain.mood}`}
      >
        Atelier Tuduri · {theme.label}
      </a>
    </div>
  )
}
