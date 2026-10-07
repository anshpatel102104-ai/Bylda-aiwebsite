import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { TOUR } from '../../data/site'
import { seg } from '../../lib/motion'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { useReveal, useSeen } from '../../lib/reveal'
import { AnalysisPanel, CallBehaviors } from '../../ui/AnalysisPanel'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { FocusCard } from '../../ui/FocusCard'
import { RepBrief } from '../../ui/RepBrief'
import { ResultChart } from '../../ui/ResultChart'
import { onTourSelect } from './tour-store'

const DWELL = 6.5 // seconds per tab
const W = 1000
const H = 560
const MIN_SCALE = 0.62 // below this the screens are unreadable; phones pan instead
const SPOT_KEY = 'bylda:tour-spotlight-seen'
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** One screen of the tour, drawn from its loop progress p (0..1). */
function Screen({ id, p }: { id: string; p: number }) {
  const s = (a: number, b: number) => seg(p, a, b)
  switch (id) {
    case 'timeline':
      return <CallTimeline lanes={s(0, 0.35)} events={s(0.2, 0.5)} metrics={s(0.3, 0.55)} marker={s(0.5, 0.75)} className="f-float" style={{ position: 'absolute', left: 40, top: 70, width: 920 }} />
    case 'analysis':
      return (
        <>
          <AnalysisPanel type={s(0, 0.7)} className="f-float" style={{ position: 'absolute', left: 30, top: 40, width: 540 }} />
          <CallBehaviors rows={s(0.45, 0.7)} highlight={s(0.78, 0.9)} className="f-float" style={{ position: 'absolute', left: 590, top: 40, width: 380 }} />
        </>
      )
    case 'profile':
      return <BehaviorTable cascade={s(0, 0.2)} count={s(0.1, 0.4)} draw={s(0.3, 0.7)} tags={s(0.5, 0.8)} className="f-float" style={{ position: 'absolute', left: 100, top: 28, width: 800 }} />
    case 'focus':
      return (
        <>
          <div className="f-card f-float" style={{ position: 'absolute', left: 40, top: 24, width: 920, height: 512, padding: '28px 36px' }}>
            <RepBrief />
          </div>
          <FocusCard type={s(0, 0.35)} cols={s(0.3, 0.6)} draw={s(0.55, 0.8)} caret style={{ position: 'absolute', left: 76, top: 228, width: 848 }} />
        </>
      )
    default:
      return <ResultChart head={s(0, 0.1)} before={s(0.05, 0.3)} focus={s(0.3, 0.4)} after={s(0.35, 0.6)} medians={s(0.55, 0.75)} rows={s(0.6, 0.85)} note={s(0.85, 0.95)} style={{ position: 'absolute', left: 30, top: 30, width: 940 }} />
  }
}

export function ProductTour() {
  const revealRef = useReveal<HTMLElement>()
  const [seenRef, seen] = useSeen<HTMLDivElement>(0.4)
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [p, setP] = useState(1)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const hold = hovering || focused
  const [inView, setInView] = useState(false)
  const [spot, setSpot] = useState(false)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const paused = usePauseAnimations()
  // Hover and focus hold the tour on its current tab; they never stop the tab's own intro.
  const animating = !reduced && !paused && !spot && inView
  const holdRef = useRef(false)
  holdRef.current = hold
  const pRef = useRef(p)
  pRef.current = p

  const go = (i: number) => {
    setActive(a => { if (a !== i) setPrev(a); return i })
    setP(reduced || paused ? 1 : 0)
  }

  useEffect(() => onTourSelect(i => go(i)))

  // Scale the fixed 1000x560 design to the panel width, but never below a readable size.
  useIsoLayout(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.max(MIN_SCALE, Math.min(1.5, e.contentRect.width / W))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Loop progress for the active tab. At the end it advances, unless the visitor is holding it.
  useEffect(() => {
    if (!animating) return
    const p0 = pRef.current >= 1 ? 0 : pRef.current
    const start = performance.now() - p0 * DWELL * 1000
    let raf = 0
    const tick = (now: number) => {
      const v = (now - start) / (DWELL * 1000)
      if (v >= 1) {
        if (holdRef.current) setP(1)
        else go((active + 1) % TOUR.length)
        return
      }
      setP(v)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, active])

  // Released after the tab finished while held: move on.
  useEffect(() => {
    if (!hold && animating && pRef.current >= 1) go((active + 1) % TOUR.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold])

  useEffect(() => { if (prev === null) return; const id = window.setTimeout(() => setPrev(null), 200); return () => window.clearTimeout(id) }, [prev])

  // Spotlight, once per visitor: dim the page, light the tabs, explain them.
  useEffect(() => {
    if (!seen || reduced) return
    let shown = false
    try { shown = window.localStorage.getItem(SPOT_KEY) === '1' } catch { shown = true }
    if (!shown) setSpot(true)
  }, [seen, reduced])
  const dismissSpot = () => {
    setSpot(false)
    try { window.localStorage.setItem(SPOT_KEY, '1') } catch { /* storage blocked */ }
    tabsRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
  }
  useEffect(() => {
    if (!spot) return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') dismissSpot() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spot])

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = TOUR.length
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    go(to)
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus()
  }

  return (
    <section id="tour" ref={revealRef} className="tour" aria-labelledby="tour-title">
      <div className="wrap" ref={seenRef}>
        <h2 id="tour-title" className="display-l rv">The product, one screen at a time.</h2>
        <div
          className="tour-body rv"
          onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}
          onFocus={() => setFocused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false) }}
        >
          <div ref={tabsRef} className="tour-tabs" role="tablist" aria-label="Product screens" data-spot={spot || undefined}>
            {TOUR.map((t, i) => (
              <button
                key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-controls={`panel-${t.id}`}
                aria-selected={active === i} tabIndex={active === i ? 0 : -1}
                className="tour-tab" onClick={() => go(i)} onKeyDown={e => onKey(e, i)}
              >
                {t.label}
                <span className="tour-tab-bar" aria-hidden="true"><b style={{ transform: `scaleX(${active === i ? p : 0})` }} /></span>
              </button>
            ))}
            {spot && (
              <div className="spot-callout" role="dialog" aria-label="How the tour works">
                <p>Pick a screen, or let the tour run. It pauses while you look.</p>
                <button type="button" className="btn btn-ink btn-sm" onClick={dismissSpot}>Got it</button>
              </div>
            )}
          </div>
          <p className="tour-caption" aria-live="polite">{TOUR[active].caption}</p>
          <p className="tour-swipe" aria-hidden="true">Swipe the screen to see all of it.</p>
          <div ref={stageRef} className="tour-stage" style={{ aspectRatio: `${W} / ${H}` }}>
            {TOUR.map((t, i) => (
              <div
                key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`}
                className="tour-panel" data-state={i === active ? 'on' : i === prev ? 'out' : 'off'} hidden={i !== active && i !== prev}
              >
                <div className="tour-sizer" style={{ width: W * scale, height: H * scale }}>
                  <div className="tour-canvas" style={{ width: W, height: H, transform: `scale(${scale})` }}>
                    {(i === active || i === prev) && <Screen id={t.id} p={i === active ? p : 1} />}
                  </div>
                </div>
              </div>
            ))}
            <span className="tour-sample">Sample data</span>
          </div>
        </div>
      </div>
      {spot && <div className="spot-scrim" onClick={dismissSpot} aria-hidden="true" />}
    </section>
  )
}
