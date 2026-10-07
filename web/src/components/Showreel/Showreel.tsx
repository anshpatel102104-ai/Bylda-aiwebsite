import { useCallback, useEffect, useLayoutEffect as useLayoutEffectClient, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { CANVAS, DEFAULT_CAMS, render, type Cams, type Variant } from './render'
import { Logo } from '../../brand/Logo'
import { Scene } from './Scene'
import { CHAPTERS, DURATION } from './timeline'
import './showreel.css'

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

  const [scrubbing, setScrubbing] = useState(false)
  const playing = !reduced && !sitePaused && !userPaused && !scrubbing && inView && pageVisible

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
      const next: Cams = { ...DEFAULT_CAMS[variant] }
      c.querySelectorAll<HTMLElement>('[data-cue]').forEach(el => { next[el.dataset.cue!] = centre(el, c) })
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

  // Lets the hero's "Watch it run" indicator show whether the film is live.
  useEffect(() => {
    document.documentElement.dataset.reel = playing ? 'playing' : 'paused'
  }, [playing])

  /* Chapter rail: click a chapter to jump, or drag along the rail to scrub. */
  const railRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; active: boolean; id: number } | null>(null)
  const dragged = useRef(false)
  const tAtX = (clientX: number) => {
    const r = railRef.current!.getBoundingClientRect()
    const x = Math.min(0.99999, Math.max(0, (clientX - r.left) / r.width)) * CHAPTERS.length
    const c = CHAPTERS[Math.floor(x)]
    return c.start + (x - Math.floor(x)) * (c.end - c.start)
  }
  const onRailDown = (e: PointerEvent) => {
    if (reduced) return
    drag.current = { x: e.clientX, active: false, id: e.pointerId }
    dragged.current = false
  }
  const onRailMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.active && Math.abs(e.clientX - d.x) > 4) {
      d.active = true
      dragged.current = true
      railRef.current!.setPointerCapture(d.id)
      setScrubbing(true)
    }
    if (d.active) setT(tAtX(e.clientX))
  }
  const onRailUp = () => {
    if (drag.current?.active) {
      setScrubbing(false)
      setEpoch(n => n + 1)
    }
    drag.current = null
  }
  const onChapterKey = (e: KeyboardEvent, i: number) => {
    const n = CHAPTERS.length
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    jump(to)
    railRef.current?.querySelectorAll<HTMLButtonElement>('.sr-chap')[to]?.focus()
  }

  const chapter = CHAPTERS[frame.chapter]
  const toggleLabel = reduced
    ? 'Animations are off because your system prefers reduced motion'
    : userPaused || sitePaused ? 'Play film' : 'Pause film'

  return (
    <div className="sr" data-variant={variant}>
      <div
        ref={stageRef}
        className="sr-stage"
        onClick={e => {
          // Clicking the film itself pauses or resumes it. Controls handle their own clicks.
          if (!reduced && !sitePaused && !(e.target as HTMLElement).closest('button')) setUserPaused(p => !p)
        }}
        data-playing={playing || undefined}
      >
        <div
          ref={canvasRef}
          className="sr-canvas"
          aria-hidden="true"
          data-nosnippet
          style={{ width: CW, height: CH, transform: `scale(${scale})`, visibility: ready ? 'visible' : 'hidden' }}
        >
          <Scene f={frame} v={variant} />
        </div>

        <span className="sr-bug"><Logo tone="light" height={variant === 'mobile' ? 9 : 11} /></span>
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
          <span className="sr-caption">{chapter.caption}</span>
        </div>
      </div>

      <div
        ref={railRef}
        className="sr-rail"
        role="group"
        aria-label="Film chapters. Drag along the rail to scrub."
        data-scrubbing={scrubbing || undefined}
        onPointerDown={onRailDown}
        onPointerMove={onRailMove}
        onPointerUp={onRailUp}
        onPointerCancel={onRailUp}
      >
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="sr-chap"
            onClick={() => { if (!dragged.current) jump(i) }}
            onKeyDown={e => onChapterKey(e, i)}
            aria-label={`Chapter ${i + 1}, ${c.label}: ${c.caption}`}
            aria-current={frame.chapter === i ? 'step' : undefined}
          >
            <span className="sr-chap-track">
              <span className="sr-chap-fill" style={{ transform: `scaleX(${reduced ? (i === frame.chapter ? 1 : 0) : frame.parts[i]})` }} />
            </span>
            <span className="sr-chap-label">{c.label}</span>
            <span className="sr-chap-cap">{c.caption}</span>
          </button>
        ))}
      </div>

      <ol className="sr-only">
        {CHAPTERS.map(c => <li key={c.id}>{c.label}: {c.describe}</li>)}
      </ol>
    </div>
  )
}
