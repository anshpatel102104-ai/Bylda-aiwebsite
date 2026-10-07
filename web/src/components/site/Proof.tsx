import { Gauge, Scales, ShieldCheck, Target } from '@phosphor-icons/react/dist/ssr'
import { PROOF, SOURCES } from '../../data/site'
import { useReveal } from '../../lib/reveal'

const ICONS = { gauge: Gauge, scales: Scales, target: Target, shield: ShieldCheck } as const

/**
 * Works with, then four proof points. No vendor logos until they are confirmed:
 * the marquee names the kinds of source the app reads, which is what it supports.
 */
export function Proof() {
  const ref = useReveal<HTMLElement>()
  const row = [...SOURCES, ...SOURCES, ...SOURCES]
  return (
    <section ref={ref} className="proof" aria-labelledby="proof-title">
      <div className="wrap">
        <h2 id="proof-title" className="proof-title rv">Works with the tools your team already records in</h2>
      </div>
      <div className="marquee rv" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map(k => (
            <div key={k} className="marquee-set">
              {row.map((s, i) => <span key={`${k}-${i}`} className="marquee-item">{s}</span>)}
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">Bylda reads calls from your CRM, dialer or call recorder, or from a manual upload.</p>
      <div className="wrap">
        <ul className="proof-points">
          {PROOF.map((p, i) => {
            const Icon = ICONS[p.icon]
            return (
              <li key={p.text} className="rv" style={{ ['--i' as string]: i }}>
                <Icon size={22} weight="regular" aria-hidden="true" />
                <span>{p.text}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
