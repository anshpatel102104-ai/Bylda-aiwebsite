import { useState } from 'react'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { BOOK_CTA, BOOK_URL, FAQ } from '../../data/site'
import { useReveal } from '../../lib/reveal'

export function Faq() {
  const ref = useReveal<HTMLElement>()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" ref={ref} className="faq" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div className="faq-intro rv">
          <h2 id="faq-title" className="display-l">Questions</h2>
          <p>Bylda is sold on a contract scoped to your team. Anything not answered here, ask us on a call.</p>
          <a className="btn btn-line" href={BOOK_URL}>{BOOK_CTA}</a>
        </div>
        <div className="acc rv">
          {FAQ.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="acc-item" data-open={isOpen || undefined}>
                <h3>
                  <button type="button" className="acc-head faq-head" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-h-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    <span className="acc-title">{f.q}</span>
                    <span className="acc-toggle"><Plus size={16} weight="bold" aria-hidden="true" /></span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-h-${i}`} className="acc-panel">
                  <div className="acc-inner"><p>{f.a}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
