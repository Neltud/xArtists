import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { TUDURI_WORKS, ATELIER_EXPLORER } from '../config/tuduriAtelier'
import { getPageTheme } from '../config/pageThemes'

/**
 * Ambient gallery of Nelson Tuduri 1/1 oils (NFTUDURI).
 * Theme shifts per route — unique gradient + panel rotation per page.
 */
export default function ArtAtelierBackdrop() {
  const { pathname } = useLocation()
  const theme = useMemo(() => getPageTheme(pathname), [pathname])

  const strip = useMemo(
    () => theme.panelIndices.map((i) => TUDURI_WORKS[i] ?? TUDURI_WORKS[0]),
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
    return () => {
      /* keep last theme until next route — avoids flash */
    }
  }, [theme])

  return (
    <div
      className={`atelier-backdrop atelier-backdrop--${theme.id} pointer-events-none`}
      aria-hidden
      data-theme={theme.id}
    >
      {/* Per-page gradient wash */}
      <div className="atelier-page-wash" />
      <div className="atelier-veil" />
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
      {/* Soft accent orb tied to page */}
      <div className="atelier-orb atelier-orb--a" />
      <div className="atelier-orb atelier-orb--b" />
      <a
        href={ATELIER_EXPLORER}
        target="_blank"
        rel="noreferrer"
        className="atelier-credit pointer-events-auto"
        title={`Thème ${theme.label}`}
      >
        Atelier Tuduri · {theme.label}
      </a>
    </div>
  )
}
