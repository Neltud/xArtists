/**
 * Public no-wallet visitor guide. Technical operations and closed experiments
 * belong to operator/lab pages, never the visitor first journey.
 */
import { Link } from 'react-router-dom'
import { useCopy } from '../experience/state'

export default function DemoTourPage() {
  const c = useCopy()
  const steps = [
    { to: '/', label: c('home'), lead: c('heroLead') },
    { to: '/museum', label: c('museum'), lead: c('museumLead') },
    { to: '/marketplace', label: c('market'), lead: c('guideMarketLead') },
    { to: '/auction', label: c('auction'), lead: c('auctionLead') },
    { to: '/studio', label: c('studio'), lead: c('studioLead') },
    { to: '/lia', label: c('lia'), lead: c('liaLead') },
    { to: '/offres', label: c('guideOffers'), lead: c('guideOffersLead') },
    { to: '/legal', label: c('legal'), lead: c('guideLegalLead') },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-28 sm:px-6 sm:py-12">
      <header className="space-y-4">
        <p className="xa-eyebrow">{c('guideSteps')}</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{c('guideTitle')}</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-300">{c('guideIntro')}</p>
        <p role="status" className="max-w-3xl rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
          {c('guideSaleNotice')}
        </p>
      </header>

      <section aria-label={c('guideSteps')}>
        <ol className="grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step.to}>
              <Link to={step.to} className="group flex h-full min-h-[112px] flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-colors hover:border-cyan-300/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                <span className="text-xs font-mono text-cyan-200/80">{String(index + 1).padStart(2, '0')}</span>
                <h2 className="text-base font-semibold text-white">{step.label}</h2>
                <p className="text-xs leading-5 text-zinc-300">{step.lead}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label={c('guideSteps')} className="flex flex-wrap gap-3">
        <Link to="/app" className="xa-button secondary">{c('appAccess')}</Link>
        <Link to="/legal" className="xa-button secondary">{c('legal')}</Link>
        <Link to="/marketplace" className="xa-button primary">{c('market')}</Link>
      </nav>
    </div>
  )
}
