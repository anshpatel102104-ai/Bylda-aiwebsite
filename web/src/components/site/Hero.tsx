import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { ChromeRibbon } from '../../brand/ChromeRibbon'
import { Mark } from '../../brand/Logo'
import { AUDIENCES, CTA } from '../../data/site'
import { CALL, FOCUS, PATTERN } from '../../data/sample'
import { openAccess } from '../../lib/site-store'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { CallBehaviors } from '../../ui/AnalysisPanel'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { PatternCard } from '../../ui/PatternCard'
import { ManagerView } from '../../ui/ManagerView'

/** Audience word that rolls in place. Every word sits in one grid cell, so the line never reflows. */
function RollingWord({ suffix = '' }: { suffix?: string }) {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()
  const paused = usePauseAnimations()
  useEffect(() => {
    if (reduced || paused) return
    const id = window.setInterval(() => setI(n => (n + 1) % AUDIENCES.length), 2600)
    return () => window.clearInterval(id)
  }, [reduced, paused])
  return (
    <span className="roll" aria-live="off">
      {AUDIENCES.map((w, k) => (
        <span key={w} className="roll-word" data-state={k === i ? 'on' : k === (i - 1 + AUDIENCES.length) % AUDIENCES.length ? 'out' : 'in'} aria-hidden={k !== i}>
          {w}{suffix}
        </span>
      ))}
    </span>
  )
}

/** The five beats of the hero story, in order. `at` is where the pointer lands, as a fraction of the card. */
const BEATS = [
  { id: 'event', label: 'Event', caption: 'Something happens on the call.', at: [0.82, 0.6] },
  { id: 'behavior', label: 'Behavior', caption: 'Bylda names how the rep acted.', at: [0.86, 0.72] },
  { id: 'pattern', label: 'Pattern', caption: 'It checks whether it keeps happening.', at: [0.78, 0.62] },
  { id: 'outcome', label: 'Outcome', caption: 'And what it travels with.', at: [0.9, 0.42] },
  { id: 'change', label: 'Change', caption: 'Then one change for the next call.', at: [0.84, 0.62] },
] as const
// One full loop is 8 seconds: 5 x 1100ms of cards, 2000ms holding the chain, 500ms fading out.
const BEAT_MS = 1100 // each card's turn in the spotlight
const HOLD_MS = 2000 // the whole chain, lit, before it resets
const OUT_MS = 500

/**
 * The hero stage: one sample story told as Bylda's chain. An event on a call,
 * the behavior it reveals, the pattern it belongs to, the outcome that pattern
 * travels with, and the change that follows. Every number is app sample data.
 *
 * The cards arrive one at a time. A pointer lands on each as it pops in, the
 * link to the next card draws, and a caption says what the step is. Then the
 * whole chain holds, fades and starts again. Prerendered, reduced motion and
 * "Pause animations": the finished chain, nothing moving.
 */
function Stage() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const paused = usePauseAnimations()
  const still = reduced || paused
  // -1 before hydration (all cards shown), 0..4 the card in focus, 5 the held chain, 6 fading out.
  const [beat, setBeat] = useState(-1)
  const [live, setLive] = useState(false)
  const [inView, setInView] = useState(true)
  const [pointer, setPointer] = useState<{ x: number; y: number; on: boolean } | null>(null)

  // Mouse parallax (max 12px), written straight to CSS variables: no React renders per move.
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let raf = 0
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { el.style.setProperty('--mx', x.toFixed(3)); el.style.setProperty('--my', y.toFixed(3)) })
    }
    const leave = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0') }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf) }
  }, [reduced])

  // Only run the story while it can be seen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    setLive(true)
    if (still) setBeat(5)
    else setBeat(b => (b < 0 || b >= 5 ? 0 : b))
  }, [still])

  // The clock: each beat schedules the next.
  useEffect(() => {
    if (still || !inView || beat < 0) return
    const wait = beat < 5 ? BEAT_MS : beat === 5 ? HOLD_MS : OUT_MS
    const id = window.setTimeout(() => setBeat(b => (b >= 6 ? 0 : b + 1)), wait)
    return () => window.clearTimeout(id)
  }, [beat, still, inView])

  // The pointer lands on the card in focus. Measured, so it is right at every breakpoint.
  useEffect(() => {
    const el = ref.current
    if (!el || beat < 0 || beat > 4) { setPointer(pt => pt && { ...pt, on: false }); return }
    const card = el.querySelector<HTMLElement>(`[data-beat="${beat}"]`)
    if (!card) return
    const r = el.getBoundingClientRect()
    const c = card.getBoundingClientRect()
    const [fx, fy] = BEATS[beat].at
    setPointer({ x: c.left - r.left + c.width * fx, y: c.top - r.top + c.height * fy, on: true })
  }, [beat])

  const state = (k: number) => {
    if (beat < 0 || beat === 5) return 'on'
    if (beat === 6) return 'out'
    return k < beat ? 'past' : k === beat ? 'active' : 'off'
  }
  // A link draws once the card it leads to is in focus.
  const link = (k: number) => (beat < 0 || (beat >= k + 1 && beat <= 5) ? 'on' : 'off')

  const nextStep = PATTERN.rows[0]
  const caption = beat >= 0 && beat <= 4 ? BEATS[beat] : null
  return (
    <div ref={ref} className="hero-stage" data-live={live || undefined} data-beat={beat} role="img"
      aria-label={`Sample story: pricing objection at ${CALL.marker.time}. Behavior: the rep answered in 0.4 seconds and offered 12% off. Pattern: 4 of 6 price objections. Outcome: next step booked 41% with an interruption versus 72% without. Change: pause before you respond.`}>
      <ChromeRibbon variant={0} width={40} opacity={0.5} className="hero-ribbon" />
      <div className="hero-trail" aria-hidden="true">
        <Mark size={420} className="trail t1" />
        <Mark size={420} className="trail t2" />
      </div>

      {/* Ghosted product column drifting upward, like the app scrolling behind the story */}
      <div className="hero-drift" aria-hidden="true">
        <div className="drift-col drift-a">
          {[0, 1].map(k => (
            <div key={k} className="drift-set">
              <BehaviorTable bare compact limit={6} className="drift-frag" style={{ width: 520 }} />
              <CallBehaviors className="drift-frag" style={{ width: 520 }} />
            </div>
          ))}
        </div>
        <div className="drift-col drift-b">
          {[0, 1].map(k => (
            <div key={k} className="drift-set">
              <PatternCard compact className="drift-frag" style={{ width: 440 }} />
              <ManagerView compact className="drift-frag" style={{ width: 440 }} />
            </div>
          ))}
        </div>
      </div>

      <svg className="hero-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id="hero-dash-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <path className="hl" data-on={link(3)} pathLength={1} d="M62 84 C 52 88, 44 90, 36 90" stroke="#fff" strokeWidth="3" fill="none" />
          </mask>
        </defs>
        <path className="hl" data-on={link(0)} pathLength={1} d="M30 17 C 40 22, 40 30, 52 33" />
        <path className="hl" data-on={link(1)} pathLength={1} d="M52 41 C 42 48, 30 50, 28 56" />
        <path className="hl" data-on={link(2)} pathLength={1} d="M30 66 C 40 70, 52 70, 60 72" />
        <path className="dashed" d="M62 84 C 52 88, 44 90, 36 90" mask="url(#hero-dash-mask)" />
      </svg>

      <div className="hc hc-event" data-beat={0} data-state={state(0)} style={{ ['--d' as string]: '1', ['--b' as string]: '7s' }}>
        <span className="hc-kind">Event</span>
        <span className="hc-chip"><i className="hc-diamond" />{CALL.marker.time} {CALL.marker.label}</span>
      </div>
      <div className="hc hc-behavior f-card" data-beat={1} data-state={state(1)} style={{ ['--d' as string]: '0.7', ['--b' as string]: '8s' }}>
        <span className="hc-kind">Behavior</span>
        <p className="hc-text">Answered in 0.4s, then offered 12% off.</p>
        <span className="f-tag hc-pop" data-tone="regress">Leak</span>
      </div>
      <div className="hc hc-pattern f-card" data-beat={2} data-state={state(2)} style={{ ['--d' as string]: '1.2', ['--b' as string]: '6.5s' }}>
        <span className="hc-kind">Pattern</span>
        <p className="hc-big"><span className="hc-pop">4</span> of 6</p>
        <p className="hc-sub">price objections, Jordan Reyes, 30 days</p>
      </div>
      <div className="hc hc-outcome f-card" data-beat={3} data-state={state(3)} style={{ ['--d' as string]: '0.9', ['--b' as string]: '7.5s' }}>
        <span className="hc-kind">Outcome</span>
        <p className="hc-text">{nextStep.label}</p>
        <div className="hc-bars">
          <span><b style={{ width: `${nextStep.with}%`, background: 'var(--signal-regress)' }} /><em>{nextStep.with}%</em><small>interrupted, n={PATTERN.withN}</small></span>
          <span><b style={{ width: `${nextStep.without}%` }} /><em>{nextStep.without}%</em><small>let them finish, n={PATTERN.withoutN}</small></span>
        </div>
        <p className="hc-note">Association, not proof</p>
      </div>
      <div className="hc hc-change" data-beat={4} data-state={state(4)} style={{ ['--d' as string]: '1.4', ['--b' as string]: '8.5s' }}>
        <span className="hc-kind">Change</span>
        <p className="hc-focus">{FOCUS.text}</p>
        <p className="hc-target">Pause {FOCUS.pause.from}s <ArrowRight size={11} weight="bold" aria-hidden="true" /> {FOCUS.pause.to}s target</p>
      </div>

      <span className="hero-pointer" data-on={pointer?.on ? 'on' : 'off'} aria-hidden="true"
        style={pointer ? { transform: `translate3d(${pointer.x}px, ${pointer.y}px, 0)` } : undefined}>
        <svg key={beat} className="hp-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" /></svg>
        <svg className="hp-arrow" viewBox="0 0 24 24"><path d="M5 3 L19 12 L12.5 13.6 L9.4 20 Z" /></svg>
      </span>

      <div className="hero-steps" data-on={caption ? 'on' : 'off'} aria-hidden="true">
        <span className="hero-steps-dots">
          {BEATS.map((b, k) => <i key={b.id} data-state={beat < 0 || beat >= 5 ? 'on' : k < beat ? 'past' : k === beat ? 'active' : 'off'} />)}
        </span>
        <span className="hero-steps-text" key={beat}>
          {caption ? <><b>{caption.label}</b> {caption.caption}</> : <><b>Sample story</b> Event to change, on one call.</>}
        </span>
      </div>
      <span className="hero-sample">Sample data</span>
    </div>
  )
}

export function Hero() {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '')
    openAccess(email, 'hero')
  }
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title" className="display-hero">Know why revenue happens.</h1>
          <p className="hero-lede">
            Bylda turns every sales call into behaviors, patterns and outcomes. Built for <RollingWord suffix="." />
          </p>
          <form className="hero-form" onSubmit={submit}>
            <label className="hero-label" htmlFor="hero-email">Work email</label>
            <input id="hero-email" name="email" type="email" autoComplete="email" />
            <button type="submit" className="btn btn-ink">{CTA}</button>
          </form>
          <a className="reel-link" href="#showreel">
            <span className="reel-live" aria-hidden="true"><i /><i /><i /></span>
            Watch it run, no clicks needed
          </a>
        </div>
        <Stage />
      </div>
    </section>
  )
}
