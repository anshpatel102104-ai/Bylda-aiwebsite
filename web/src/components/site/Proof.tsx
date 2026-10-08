import { Gauge, Scales, ShieldCheck, Target } from '@phosphor-icons/react/dist/ssr'
import { PROOF, SOURCES } from '../../data/site'
import { useReveal } from '../../lib/reveal'

const ICONS = { gauge: Gauge, scales: Scales, target: Target, shield: ShieldCheck } as const

/**
 * Works with, then four proof points. No vendor logos until they are confirmed:
 * the row names the kinds of source the app reads, once each. A scrolling
 * marquee of four generic labels read as filler, so it is a static row.
 */
export function Proof() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className="proof" aria-labelledby="proof-title">
      <div className="wrap">
        <h2 id="proof-title" className="proof-title rv">Works with the tools your team already records in</h2>
        <ul className="sources rv" aria-label="Sources Bylda reads">
          {SOURCES.map(s => <li key={s} className="marquee-item">{s}</li>)}
        </ul>
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
