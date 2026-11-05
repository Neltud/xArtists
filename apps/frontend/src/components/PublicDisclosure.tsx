import { useState, type ReactNode } from 'react'
import './publicDisclosure.css'

/** Accessible optional detail; defer tools until opened and preserve entered data. */
export default function PublicDisclosure({ id, title, subtitle, children, level = 2 }: {
  id: string; title: ReactNode; subtitle?: ReactNode; children: ReactNode; level?: 2 | 3
}) {
  const [expanded, setExpanded] = useState(false)
  const [visited, setVisited] = useState(false)
  const Heading = level === 3 ? 'h3' : 'h2'
  return <section className="xa-public-disclosure">
    <Heading>
      <button id={id + '-trigger'} type="button" aria-expanded={expanded} aria-controls={id}
        onClick={() => { setVisited(true); setExpanded(value => !value) }}>
        <span><span className="xa-public-disclosure__title">{title}</span>
          {subtitle && <span className="xa-public-disclosure__subtitle">{subtitle}</span>}</span>
        <span className="xa-public-disclosure__icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
    </Heading>
    <div id={id} role="region" aria-labelledby={id + '-trigger'} hidden={!expanded}
      className="xa-public-disclosure__body">{visited ? children : null}</div>
  </section>
}
