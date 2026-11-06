/**
 * Wallet-optional beginner journey. Core destinations first, specialist/finance
 * tools in an explicit disclosure. All labels come from the 8-locale catalogue.
 */
import { Link } from 'react-router-dom'
import { useCopy } from '../experience/state'
import Icon from '../experience/Icon'

export default function DemoTourPage() {
  const c = useCopy()
  const steps = [
    { to: '/museum', label: c('welcomeExplore'), lead: c('welcomeExploreDesc'), icon: 'museum' },
    { to: '/studio', label: c('welcomeCreate'), lead: c('welcomeCreateDesc'), icon: 'create' },
    { to: '/marketplace', label: c('welcomeMarket'), lead: c('welcomeMarketDesc'), icon: 'market' },
    { to: '/dao', label: c('welcomeDao'), lead: c('welcomeDaoDesc'), icon: 'network' },
  ]
  const extra = [
    { to: '/auction', label: c('auction'), lead: c('auctionLead') },
    { to: '/lia', label: c('lia'), lead: c('liaLead') },
    { to: '/offres', label: c('guideOffers'), lead: c('guideOffersLead') },
    { to: '/legal', label: c('legal'), lead: c('guideLegalLead') },
  ]

  return <div className="xa-container xa-guide-page">
    <header className="xa-guide-header">
      <p className="xa-eyebrow">{c('guideSteps')}</p>
      <h1>{c('guideTitle')}</h1>
      <p className="xa-guide-lead">{c('guideIntro')}</p>
      <p className="xa-guide-notice" role="status"><Icon name="shield" size={18}/>{c('guideSaleNotice')}</p>
    </header>
    <section className="xa-guide-section" aria-labelledby="xa-guide-start">
      <h2 id="xa-guide-start">{c('welcomeAsk')}</h2>
      <ol className="xa-guide-steps">
        {steps.map((step, index) => <li key={step.to}>
          <Link className="xa-guide-step" to={step.to}>
            <span className="xa-guide-step-icon"><Icon name={step.icon} size={23}/></span>
            <span className="xa-guide-step-number">{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.label}</strong>
            <span className="xa-guide-step-lead">{step.lead}</span>
            <span className="xa-guide-step-link">{c('open')}<Icon name="arrow" size={17}/></span>
          </Link>
        </li>)}
      </ol>
    </section>
    <details className="xa-guide-advanced">
      <summary>{c('welcomeAdvanced')}<Icon name="chevron" size={17}/></summary>
      <div className="xa-guide-extra">
        {extra.map(step => <Link key={step.to} to={step.to} className="xa-guide-extra-link">
          <strong>{step.label}</strong><span>{step.lead}</span><Icon name="arrow" size={17}/>
        </Link>)}
      </div>
    </details>
    <nav className="xa-guide-actions" aria-label={c('guideSteps')}>
      <Link to="/directory" className="xa-button secondary">{c('directory')}<Icon name="arrow" size={16}/></Link>
      <Link to="/roadmap" className="xa-button secondary">{c('roadmapLabel')}<Icon name="arrow" size={16}/></Link>
      <Link to="/museum" className="xa-button primary">{c('welcomeExplore')}<Icon name="arrow" size={16}/></Link>
    </nav>
  </div>
}
