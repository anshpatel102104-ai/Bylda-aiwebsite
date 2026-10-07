import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { LOOP } from '../../data/site'
import { CALL } from '../../data/sample'
import { useReveal } from '../../lib/reveal'
import { AnalysisPanel } from '../../ui/AnalysisPanel'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { PatternCard } from '../../ui/PatternCard'
import { selectTourTab } from './tour-store'

/** The fragment each card floats: a front layer, and a second layer revealed on hover. */
function Fragment({ id }: { id: string }) {
  switch (id) {
    case 'event':
      return (
        <>
          <CallTimeline compact className="lc-frag lc-back f-float" style={{ width: 480 }} />
          <span className="lc-front lc-chip"><i className="hc-diamond" />{CALL.marker.time} {CALL.marker.label}</span>
        </>
      )
    case 'behavior':
      return <AnalysisPanel compact className="lc-frag lc-back f-float" style={{ width: 480 }} />
    case 'pattern':
      return <BehaviorTable compact limit={7} className="lc-frag lc-back f-float" style={{ width: 480 }} />
    default:
      return <PatternCard compact className="lc-frag lc-back f-float" style={{ width: 480 }} />
  }
}

/** Events, behaviors, patterns, outcomes: the theory, as four unequal cards. */
export function LoopCards() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className="loop" aria-labelledby="loop-title">
      <div className="wrap">
        <h2 id="loop-title" className="display-l rv">Every deal leaves a trail. Bylda reads it in order.</h2>
        <div className="loop-grid">
          {LOOP.map((c, i) => (
            <a key={c.id} href="#tour" className={`lc lc-${c.id} rv`} style={{ ['--i' as string]: i }} onClick={() => selectTourTab(c.tab)}>
              <div className="lc-stage" aria-hidden="true" data-nosnippet><Fragment id={c.id} /></div>
              <div className="lc-copy">
                <h3 className="lc-title">{c.title}</h3>
                <p className="lc-line">{c.line}</p>
                <span className="lc-more">Explore <ArrowRight size={14} weight="bold" aria-hidden="true" /></span>
              </div>
            </a>
          ))}
        </div>
        <p className="loop-close rv">Then Bylda closes the loop: one change per rep, measured on the calls that follow.</p>
      </div>
    </section>
  )
}
