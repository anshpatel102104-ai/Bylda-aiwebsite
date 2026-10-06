import { useState } from 'react'
import { CTA } from '../../data/site'
import { openAccess } from '../../lib/site-store'

/**
 * Pricing, built with the brief's mechanics and hidden until numbers are
 * confirmed. Shows only with ?pricing=1. Prices render as TBD on purpose.
 */
const TIERS = [
  { name: 'Starter', who: 'For one sales team getting started.', highlight: false, details: ['Call review and behavior analysis', 'Rep daily brief', 'Manager daily brief'] },
  { name: 'Growth', who: 'For teams coaching every week.', highlight: true, details: ['Everything in Starter', 'Coaching focus and results', 'Behavior profiles and patterns'] },
  { name: 'Enterprise', who: 'For revenue organizations with custom needs.', highlight: false, details: ['Everything in Growth', 'Roles and permissions', 'Retention and privacy controls', 'Audit log (roadmap)'] },
] as const

export function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [details, setDetails] = useState(false)
  return (
    <section id="pricing" className="pricing" aria-labelledby="pricing-title">
      <div className="wrap">
        <h2 id="pricing-title" className="display-l">Pricing</h2>
        <div className="seg" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annual <span className="seg-badge">Save TBD</span></button>
        </div>
        <div className="tiers">
          {TIERS.map(t => (
            <div key={t.name} className="tier" data-highlight={t.highlight || undefined}>
              <h3>{t.name}</h3>
              <p>{t.who}</p>
              <p className="tier-price">TBD <small>{annual ? 'per seat, billed yearly' : 'per seat, monthly'}</small></p>
              <button type="button" className={`btn ${t.highlight ? 'btn-ink' : 'btn-line'} btn-block`} onClick={() => openAccess('', `pricing-${t.name.toLowerCase()}`)}>{CTA}</button>
              {details && <ul>{t.details.map(d => <li key={d}>{d}</li>)}</ul>}
            </div>
          ))}
        </div>
        <button type="button" className="link-btn" aria-expanded={details} onClick={() => setDetails(d => !d)}>{details ? 'Hide details' : 'Show details'}</button>
        <p className="pricing-note">No credit card required.</p>
      </div>
    </section>
  )
}
