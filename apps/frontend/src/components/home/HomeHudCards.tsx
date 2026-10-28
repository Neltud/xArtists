import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/** 3 cartes HUD — Shell tokens acid/graphite */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

const CARD_META = [
  {
    to: '/museum',
    emoji: '🏛️',
    titleKey: 'home.card.gallery.title',
    blurbKey: 'home.card.gallery.blurb',
    accent: 'border-[color:var(--xa-border-strong)] hover:border-[color:var(--xa-accent)]',
    glow: 'shadow-[0_0_24px_rgba(205,245,139,0.12)]',
  },
  {
    to: '/lia',
    emoji: '🤖',
    titleKey: 'home.card.lia.title',
    blurbKey: 'home.card.lia.blurb',
    accent: 'border-[color:var(--xa-border-strong)] hover:border-[color:var(--xa-accent)]',
    glow: 'shadow-[0_0_24px_rgba(205,245,139,0.12)]',
  },
  {
    to: '/tca',
    emoji: '🎓',
    titleKey: 'home.card.tca.title',
    blurbKey: 'home.card.tca.blurb',
    accent: 'border-[color:var(--xa-border-strong)] hover:border-[color:var(--xa-accent)]',
    glow: 'shadow-[0_0_24px_rgba(205,245,139,0.12)]',
  },
] as const

export default function HomeHudCards() {
  const { t } = useI18n()

  return (
    <div className="relative w-full max-w-3xl">
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl border border-[color:var(--xa-border)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-[color:var(--xa-accent)]/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-px w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-[color:var(--xa-accent)]/50 to-transparent"
        aria-hidden
      />

      <div className="grid gap-3 sm:grid-cols-3 animate-[fadeIn_0.6s_ease-out]">
        {xaRender(CARD_META.map((c, i) => (
          <Link
            key={c.to}
            to={c.to}
            style={{ animationDelay: `${120 + i * 90}ms` }}
            className={`group relative min-h-[44px] rounded-2xl border bg-gradient-to-br from-[color:var(--xa-bg-elevated)] via-black/70 to-[color:var(--xa-surface)] backdrop-blur-xl p-4 shadow-2xl transition active:scale-[0.98] hover:brightness-110 ${c.accent} ${c.glow}`}
          >
            <span
              className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-white/30"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-white/30"
              aria-hidden
            />
            <p className="text-2xl mb-2" aria-hidden>
              {xaRender(c.emoji)}
            </p>
            <h2 className="text-sm font-semibold text-[color:var(--xa-text)] group-hover:text-[color:var(--xa-accent)]">
              {xaRender(t(c.titleKey))}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--xa-text-secondary)]">{xaRender(t(c.blurbKey))}</p>
          </Link>
        )))}
      </div>
    </div>
  )
}
