/**
 * Footer juridique global — disclaimer non-custodial / paper / fiat tiers.
 */
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'
import { LEGAL_ENTITY } from '../config/legalEntity'

export const LEGAL_FOOTER_DISCLAIMER =
  'xArtists est une interface logicielle décentralisée et non-custodiale. Aucun conseil financier. Signaux fournis à titre éducatif (Paper Trading). Les services Fiat sont assurés par des entités tiers régulées.'

export default function FooterLegal() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-black/40 px-3 py-5 pb-24 md:pb-6">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="text-[10px] leading-relaxed text-zinc-500 text-center sm:text-left">
          {LEGAL_FOOTER_DISCLAIMER}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-zinc-600 sm:justify-start">
          <Link to="/legal" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Mentions légales
          </Link>
          <Link to="/legal?tab=cgu" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Conditions
          </Link>
          <Link to="/legal?tab=risk" className="hover:text-zinc-400 underline-offset-2 hover:underline">
            Risques
          </Link>
          <a href={LINKS.github} className="hover:text-zinc-400" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>MultiversX mainnet</span>
          <span>
            © {year} {LEGAL_ENTITY.publisherName || 'xArtists'}
          </span>
        </div>
      </div>
    </footer>
  )
}
