import { useCallback, useEffect, useLayoutEffect as useLayoutEffectClient, useMemo, useRef, useState } from 'react'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { CANVAS, DEFAULT_CAMS, render, type Cams, type Variant } from './render'
import { Scene } from './Scene'
import { CHAPTERS, DURATION } from './timeline'
import './showreel.css'

const BASE = import.meta.env.BASE_URL
// The page is prerendered, so layout effects must not run (or warn) on the server.
const useLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffectClient
/** Must match the aspect-ratio media query in showreel.css. */
const MOBILE_QUERY = '(max-width: 760px)'

/** ?t=12.5 opens the film paused at that time (screenshots, review links). */
function initialT(): number | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('t')
  return v === null ? null : Math.max(0, Math.min(DURATION - 0.001, Number(v) || 0))
}

/** Centre of an element on the unscaled canvas. Offsets ignore CSS transforms, so camera moves do not skew it. */
function centre(el: HTMLElement, canvas: HTMLElement) {
  let x = el.offsetWidth / 2
  let y = el.offsetHeight / 2
  let n: HTMLElement | null = el
  while (n && n !== canvas) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y }
}

export function Showreel() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  // Server and first client render agree (desktop, t=0, hidden canvas); the
  // real size, variant and start time are applied before the first paint.
  const [width, setWidth] = useState(1100)
  const [mobile, setMobile] = useState(false)
  const [ready, setReady] = useState(false)
  const variant: Variant = mobile ? 'mobile' : 'desktop'
  const { w: CW, h: CH } = CANVAS[variant]
  const scale = width / CW

  const reduced = useReducedMotion()
  const sitePaused = usePauseAnimations()
  const forced = useRef<number | null>(null)
  const [userPaused, setUserPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [t, setT] = useState(0)
  const [cams, setCams] = useState<Cams>(DEFAULT_CAMS[variant])
  // Bumped on every seek so the clock restarts from the new time.
  const [epoch, setEpoch] = useState(0)

  const playing = !reduced && !sitePaused && !userPaused && inView && pageVisible

  // Size: the canvas is a fixed design scaled to the stage width.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const mq = window.matchMedia(MOBILE_QUERY)
    const onMq = () => setMobile(mq.matches)
    onMq()
    mq.addEventListener('change', onMq)
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    const f = initialT()
    if (f !== null) {
      forced.current = f
      setUserPaused(true)
      setT(f)
    }
    setReady(true)
    return () => { ro.disconnect(); mq.removeEventListener('change', onMq) }
  }, [])

  // Camera targets come from the real layout, measured once fonts have settled.
  useEffect(() => {
    let cancelled = false
    const measure = () => {
      const c = canvasRef.current
      if (!c || cancelled) return
      const next = { ...DEFAULT_CAMS[variant] }
      for (const key of ['marker', 'gotit', 'phantom'] as const) {
        const el = c.querySelector<HTMLElement>(`[data-cam="${key}"]`)
        if (el) next[key] = centre(el, c)
      }
      setCams(next)
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => { cancelled = true }
  }, [variant])

  // Plays only while on screen.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Pauses when the tab is hidden.
  useEffect(() => {
    const on = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  // The clock. Time is read from performance.now(), never accumulated per frame.
  const tRef = useRef(t)
  tRef.current = t
  useEffect(() => {
    if (!playing) return
    const t0 = tRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      setT((t0 + (now - start) / 1000) % DURATION)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, epoch])

  // Reduced motion: hold each chapter's end state.
  useLayoutEffect(() => {
    if (reduced && forced.current === null) setT(CHAPTERS[0].still)
  }, [reduced])

  const frame = useMemo(() => render(t, variant, cams), [t, variant, cams])

  const jump = useCallback((i: number) => {
    setT(reduced ? CHAPTERS[i].still : CHAPTERS[i].start + 0.001)
    setEpoch(e => e + 1)
  }, [reduced])

  const chapter = CHAPTERS[frame.chapter]
  const toggleLabel = reduced
    ? 'Animations are off because your system prefers reduced motion'
    : userPaused || sitePaused ? 'Play film' : 'Pause film'

  return (
    <div className="sr" data-variant={variant}>
      <div
        ref={stageRef}
        className="sr-stage"
      >
        <div
          ref={canvasRef}
          className="sr-canvas"
          aria-hidden="true"
          style={{ width: CW, height: CH, transform: `scale(${scale})`, visibility: ready ? 'visible' : 'hidden' }}
        >
          <Scene f={frame} v={variant} base={BASE} />
        </div>

        <span className="sr-sample">Sample data</span>

        <div className="sr-controls">
          <button
            type="button"
            className="sr-btn"
            onClick={() => setUserPaused(p => !p)}
            aria-label={toggleLabel}
            title={toggleLabel}
            disabled={reduced || sitePaused}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor" /><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="sr-caption">{chapter.label}</span>
        </div>

        <div className="sr-progress" role="group" aria-label="Film chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className="sr-part"
              onClick={() => jump(i)}
              aria-label={`Chapter ${i + 1}: ${c.label}`}
              aria-current={frame.chapter === i ? 'step' : undefined}
            >
              <span className="sr-part-track"><span className="sr-part-fill" style={{ transform: `scaleX(${reduced ? (i <= frame.chapter ? 1 : 0) : frame.parts[i]})` }} /></span>
            </button>
          ))}
        </div>
      </div>

      <ol className="sr-only">
        {CHAPTERS.map(c => <li key={c.id}>{c.label}: {c.describe}</li>)}
      </ol>
    </div>
  )
}
