/**
 * Footer juridique global — protocol chrome.
 */
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'
import { LEGAL_ENTITY } from '../config/legalEntity'

export const LEGAL_FOOTER_DISCLAIMER =
  'xArtists is a non-custodial software interface. No financial advice. Educational / paper signals. Fiat services via regulated third parties. · Interface non-custodiale. Pas de conseil financier. Signaux éducatifs (paper). Fiat via tiers régulés.'

export default function FooterLegal() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t px-3 py-6 pb-24 md:pb-8"
      style={{ borderColor: 'var(--xa-border)', background: 'var(--xa-bg)' }}
    >
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="text-[10px] leading-relaxed text-center sm:text-left" style={{ color: 'var(--xa-text-muted)' }}>
          {LEGAL_FOOTER_DISCLAIMER}
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] sm:justify-start"
          style={{ color: 'var(--xa-text-muted)' }}
        >
          <Link to="/legal" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Legal
          </Link>
          <Link to="/legal?tab=cgu" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Terms
          </Link>
          <Link to="/legal?tab=risk" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Risks
          </Link>
          <a href={LINKS.github} className="hover:text-zinc-400" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>MultiversX</span>
          <span>
            © {year} {LEGAL_ENTITY.publisherName || 'xArtists'}
          </span>
        </div>
      </div>
    </footer>
  )
}
