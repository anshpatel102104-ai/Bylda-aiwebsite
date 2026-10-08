import { type FormEvent } from 'react'
import { ChromeRibbon } from '../../brand/ChromeRibbon'
import { Logo, Mark } from '../../brand/Logo'
import { CTA, FOOTER } from '../../data/site'
import { setPauseAnimations, usePauseAnimations } from '../../lib/prefs'
import { useSeen } from '../../lib/reveal'
import { openAccess } from '../../lib/site-store'

export function FinalCta() {
  const [ref, seen] = useSeen<HTMLElement>(0.3)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    openAccess(String(new FormData(e.currentTarget).get('email') ?? ''), 'final-cta')
  }
  return (
    <section ref={ref} className="final" data-env="black" data-nav-dark data-seen={seen || undefined} aria-labelledby="final-title">
      <ChromeRibbon variant={1} width={38} opacity={0.22} className="final-ribbon" />
      <div className="wrap final-inner">
        <Mark size={150} className="final-mark" />
        <h2 id="final-title" className="display-l">Coach the behaviors that win deals.</h2>
        <form className="hero-form final-form" onSubmit={submit}>
          <label className="hero-label" htmlFor="final-email">Work email</label>
          <input id="final-email" name="email" type="email" autoComplete="email" />
          <button type="submit" className="btn btn-pearl">{CTA}</button>
        </form>
      </div>
    </section>
  )
}

export function Footer() {
  const paused = usePauseAnimations()
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo height={15} />
          <p>Behavioral sales intelligence.</p>
        </div>
        {FOOTER.map(col => (
          <nav key={col.title} aria-label={col.title} className="footer-col">
            <h3>{col.title}</h3>
            <ul>{col.links.map(l => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul>
          </nav>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>&copy; {new Date().getFullYear()} Bylda</span>
        <button type="button" className="pause-toggle" aria-pressed={paused} onClick={() => setPauseAnimations(!paused)}>
          {paused ? 'Resume animations' : 'Pause animations'}
        </button>
      </div>
    </footer>
  )
}
