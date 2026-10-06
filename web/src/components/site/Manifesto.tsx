import { useEffect, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Mark } from '../../brand/Logo'
import { CTA, MANIFESTO } from '../../data/site'
import { CALL, PATTERN } from '../../data/sample'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { useSeen } from '../../lib/reveal'
import { openAccess } from '../../lib/site-store'

/** Types the mono copy in, once, when the panel is first seen. */
function useTypeOnce(text: string, seen: boolean, cps = 55) {
  const reduced = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!seen) return
    if (reduced) { setN(text.length); return }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(text.length, Math.floor(((now - start) / 1000) * cps))
      setN(k)
      if (k < text.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, reduced, text, cps])
  return text.slice(0, n)
}

/** What cycles inside the parentheses: the mark, then fragments of the story. */
const FRAMES = ['mark', 'event', 'pattern', 'outcome'] as const

export function Manifesto() {
  const [ref, seen] = useSeen<HTMLElement>(0.35)
  const typed = useTypeOnce(MANIFESTO.copy.toUpperCase(), seen)
  const paused = usePauseAnimations()
  const reduced = useReducedMotion()
  const [f, setF] = useState(0)
  useEffect(() => {
    if (!seen || paused || reduced) return
    const id = window.setInterval(() => setF(i => (i + 1) % FRAMES.length), 2600)
    return () => window.clearInterval(id)
  }, [seen, paused, reduced])

  return (
    <section ref={ref} className="manifesto" aria-label="Manifesto">
      <div className="wrap manifesto-grid">
        <div className="mf-left" data-env="black">
          <h2 className="mf-head">
            <span className="mf-l1">{MANIFESTO.lines[0]}</span>
            <span className="mf-l2">{MANIFESTO.lines[1]}</span>
            <span className="mf-l3">{MANIFESTO.lines[2]}</span>
          </h2>
          <p className="mf-copy">
            <span className="sr-only">{MANIFESTO.copy}</span>
            <span aria-hidden="true">{typed}<i className="mf-caret" data-done={typed.length >= MANIFESTO.copy.length || undefined} /></span>
          </p>
          <div className="mf-cta">
            <button type="button" className="mf-round" aria-label={CTA} onClick={() => openAccess('', 'manifesto')}><ArrowRight size={20} weight="bold" /></button>
            <button type="button" className="mf-bracket" onClick={() => openAccess('', 'manifesto')}><span aria-hidden="true">[</span>{CTA.toUpperCase()}<span aria-hidden="true">]</span></button>
          </div>
        </div>
        <div className="mf-right">
          <span className="mf-corner mf-tl">Behavior, not activity</span>
          <span className="mf-corner mf-br">Sample data</span>
          <span className="mf-strip mf-strip-top" aria-hidden="true" />
          <p className="mf-giant">
            <span className="sr-only">See why</span>
            <span aria-hidden="true">SEE</span>
            <span className="mf-paren" aria-hidden="true">(</span>
            <span className="mf-frame" aria-hidden="true">
              {FRAMES.map((k, i) => (
                <span key={k} className="mf-slot" data-on={i === f || undefined}>
                  {k === 'mark' && <Mark size={160} />}
                  {k === 'event' && <span className="mf-chip"><i className="hc-diamond" />{CALL.marker.time}</span>}
                  {k === 'pattern' && <span className="mf-stat"><b>4 of 6</b><small>price objections</small></span>}
                  {k === 'outcome' && <span className="mf-stat"><b>{PATTERN.rows[0].with}% <em>vs</em> {PATTERN.rows[0].without}%</b><small>next step booked</small></span>}
                </span>
              ))}
            </span>
            <span className="mf-paren" aria-hidden="true">)</span>
            <span aria-hidden="true">WHY</span>
          </p>
          <span className="mf-strip mf-strip-bottom" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
