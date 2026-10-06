import { useState } from 'react'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { CAPABILITIES } from '../../data/site'
import { useReveal } from '../../lib/reveal'
import { StatusTag } from './Nav'
import { OutcomeGraph } from './OutcomeGraph'

/**
 * Capabilities by the app's own product loop. Status per item comes from the
 * Figma sitemap legend, so "Roadmap" and "Concept" are honest labels, not modesty.
 */
export function Capabilities() {
  const ref = useReveal<HTMLElement>()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="capabilities" ref={ref} className="caps" aria-labelledby="caps-title">
      <div className="wrap caps-grid">
        <div className="caps-intro">
          <h2 id="caps-title" className="display-l rv">What it does today, and what comes next.</h2>
          <p className="caps-legend rv">
            <span className="status-tag" data-status="v1">First release</span>
            <span className="status-tag" data-status="roadmap">Roadmap</span>
            <span className="status-tag" data-status="concept">Concept</span>
          </p>
          <OutcomeGraph className="rv caps-graph" />
        </div>
        <div className="acc rv">
          {CAPABILITIES.map((g, i) => {
            const isOpen = open === i
            return (
              <div key={g.group} className="acc-item" data-open={isOpen || undefined}>
                <h3>
                  <button type="button" className="acc-head" aria-expanded={isOpen} aria-controls={`cap-${i}`} id={`cap-h-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    <span className="acc-title">{g.group}</span>
                    <span className="acc-line">{g.line}</span>
                    <span className="acc-toggle"><span className="acc-show">{isOpen ? 'Hide details' : 'Show details'}</span><Plus size={16} weight="bold" aria-hidden="true" /></span>
                  </button>
                </h3>
                <div id={`cap-${i}`} role="region" aria-labelledby={`cap-h-${i}`} className="acc-panel">
                  <div className="acc-inner">
                    <ul>
                      {g.items.map(it => (
                        <li key={it.label} data-status={it.status}>
                          <span className="cap-label">{it.label} <StatusTag status={it.status} /></span>
                          <span className="cap-detail">{it.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
