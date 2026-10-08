import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowCounterClockwise, CaretRight, Check, Info } from '@phosphor-icons/react/dist/ssr'
import { CTA } from '../../data/site'
import {
  GROUP_BLURB, GROUPS, LOOP_STEPS, PRODUCT_PAGES, STATUS_NOTE, productHref, type ProductPage as Page,
} from '../../data/product-pages'
import { usePauseAnimations, useReducedMotion } from '../../lib/prefs'
import { useReveal } from '../../lib/reveal'
import { openAccess } from '../../lib/site-store'
import { FinalCta } from '../site/Closing'
import { StatusTag } from '../site/Nav'
import { ProductScreen, SCREEN_H, SCREEN_W } from './ProductScreen'

const PLAY_S = 5.5 // seconds for the screen's intro
const MIN_SCALE = 0.56 // below this the screen is unreadable; phones pan instead
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect
const STATUS_LABEL = { v1: 'First release', roadmap: 'Roadmap', concept: 'Concept' } as const

/**
 * The page's product screen on a glass stage. It plays its intro once when it
 * scrolls into view, and again on Replay. Prerendered and reduced motion: the
 * finished screen.
 */
function ScreenStage({ page }: { page: Page }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [p, setP] = useState(1)
  const [run, setRun] = useState(0)
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()
  const paused = usePauseAnimations()

  useIsoLayout(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.max(MIN_SCALE, Math.min(1.4, e.contentRect.width / SCREEN_W))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // First play when the stage is a third visible.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    if (reduced || paused) { setReady(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setRun(1); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, paused])

  useEffect(() => {
    if (!run) return
    if (reduced || paused) { setP(1); setReady(true); return }
    setP(0)
    setReady(true)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const v = Math.min(1, (now - start) / (PLAY_S * 1000))
      setP(v)
      if (v < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, reduced, paused])

  return (
    <div className="pp-stage-wrap">
      <div ref={stageRef} className="tour-stage pp-stage" data-ready={ready || undefined} style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}
        role="img" aria-label={`${page.label}: ${page.lede} Sample data.`}>
        <div className="pp-pan">
          <div className="tour-sizer" style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}>
            <div className="tour-canvas" style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})` }} aria-hidden="true">
              <ProductScreen id={page.screen} p={p} />
            </div>
          </div>
        </div>
        <span className="tour-sample">{page.illustrative ? 'Sample data · illustrative' : 'Sample data'}</span>
      </div>
      <div className="pp-stage-bar">
        <span className="pp-swipe">Swipe the screen to see all of it.</span>
        <span className="pp-sample-m">{page.illustrative ? 'Sample data · illustrative' : 'Sample data'}</span>
        <button type="button" className="pp-replay" onClick={() => setRun(r => r + 1)} disabled={p < 1 && run > 0}>
          <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" /> Replay
        </button>
      </div>
    </div>
  )
}

export function ProductPage({ page }: { page: Page }) {
  const ref = useReveal<HTMLDivElement>()
  const i = PRODUCT_PAGES.indexOf(page)
  const prev = PRODUCT_PAGES[(i - 1 + PRODUCT_PAGES.length) % PRODUCT_PAGES.length]
  const next = PRODUCT_PAGES[(i + 1) % PRODUCT_PAGES.length]
  const siblings = PRODUCT_PAGES.filter(p => p.group === page.group && p !== page)
  const loopAt = LOOP_STEPS.findIndex(s => s.id === page.loop)
  const source = `product-${page.slug}`

  return (
    <div ref={ref} className="pp" data-status={page.status}>
      <section className="pp-hero" aria-labelledby="pp-title">
        <div className="wrap">
          <nav className="pp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href="/">Home</a></li>
              <li><CaretRight size={11} weight="bold" aria-hidden="true" /><a href="/product">Product</a></li>
              <li><CaretRight size={11} weight="bold" aria-hidden="true" /><span>{page.group}</span></li>
              <li><CaretRight size={11} weight="bold" aria-hidden="true" /><span aria-current="page">{page.label}</span></li>
            </ol>
          </nav>

          <div className="pp-hero-grid">
            <div>
              <p className="pp-eyebrow">
                <span>{page.label}</span>
                <span className="status-tag" data-status={page.status}>{STATUS_LABEL[page.status]}</span>
              </p>
              <h1 id="pp-title" className="display-hero pp-h1">{page.title}</h1>
            </div>
            <div className="pp-hero-side">
              <p className="pp-lede">{page.lede}</p>
              <p className="pp-q"><span className="f-label">Answers</span>{page.question}</p>
              <div className="pp-ctas">
                <button type="button" className="btn btn-ink" onClick={() => openAccess('', source)}>{CTA}</button>
              </div>
            </div>
          </div>

          {page.status !== 'v1' && (
            <div className="pp-note" data-status={page.status} role="note">
              <Info size={18} weight="bold" aria-hidden="true" />
              <p><b>{STATUS_NOTE[page.status].title}.</b> {STATUS_NOTE[page.status].text}</p>
            </div>
          )}

          <ScreenStage page={page} />
        </div>
      </section>

      <section className="pp-sec" aria-labelledby="pp-how">
        <div className="wrap">
          <h2 id="pp-how" className="display-l rv">{page.status === 'v1' ? 'How it works' : 'How it would work'}</h2>
          <ol className="pp-steps" data-count={page.steps.length}>
            {page.steps.map((s, k) => (
              <li key={s.title} className="pp-step rv" style={{ ['--i' as string]: k }}>
                <span className="pp-step-n f-mono">{String(k + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pp-sec pp-sec-tint" aria-labelledby="pp-see">
        <div className="wrap pp-split">
          <div className="pp-split-intro">
            <h2 id="pp-see" className="display-l rv">What you see</h2>
            <p className="pp-sub rv">Read off the screen above. Every number is sample data from the app’s own prototypes{page.illustrative ? ', arranged in an illustrative layout' : ''}.</p>
          </div>
          <dl className="pp-anatomy">
            {page.anatomy.map((a, k) => (
              <div key={a.label} className="pp-anat rv" style={{ ['--i' as string]: k }}>
                <dt>{a.label}</dt>
                <dd>{a.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pp-sec" aria-labelledby="pp-who">
        <div className="wrap">
          <h2 id="pp-who" className="display-l rv">Who it’s for</h2>
          <div className="pp-uses">
            {page.uses.map((u, k) => (
              <div key={u.role} className={`pp-use rv ${u.role === 'Reps' ? 'pp-use-dark' : ''}`} style={{ ['--i' as string]: k }}>
                <span className="pp-use-role">{u.role}</span>
                <p>{u.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-sec pp-sec-tint" aria-labelledby="pp-loop">
        <div className="wrap pp-split">
          <div className="pp-split-intro">
            <h2 id="pp-loop" className="display-l rv">Where it fits</h2>
            <p className="pp-sub rv">Bylda is one loop. {page.label} is the {LOOP_STEPS[loopAt].label.toLowerCase()} step.</p>
          </div>
          <div>
            <ol className="pp-loopline rv" aria-label="The Bylda loop">
              {LOOP_STEPS.map((s, k) => (
                <li key={s.id} data-on={k === loopAt || undefined} data-past={k < loopAt || undefined}>
                  <b>{s.label}</b><span>{s.line}</span>
                </li>
              ))}
            </ol>
            <div className="pp-limits rv">
              <h3>What it won’t claim</h3>
              <ul>
                {page.limits.map(l => <li key={l}><Check size={15} weight="bold" aria-hidden="true" />{l}</li>)}
              </ul>
              {page.more && <a className="pp-more-link" href={page.more.href}>{page.more.label} <ArrowRight size={14} weight="bold" aria-hidden="true" /></a>}
            </div>
          </div>
        </div>
      </section>

      <section className="pp-sec" aria-labelledby="pp-explore">
        <div className="wrap">
          <div className="pp-pager rv">
            <a href={productHref(prev.slug)} className="pp-pg"><ArrowLeft size={16} weight="bold" aria-hidden="true" /><span><small>Previous</small>{prev.label}</span></a>
            <a href={productHref(next.slug)} className="pp-pg pp-pg-next"><span><small>Next</small>{next.label}</span><ArrowRight size={16} weight="bold" aria-hidden="true" /></a>
          </div>
          {siblings.length > 0 && (
            <div className="pp-siblings rv">
              <h2 id="pp-explore" className="pp-h3">Also in {page.group}</h2>
              <div className="pp-sib-grid">
                {siblings.map(s => (
                  <a key={s.slug} href={productHref(s.slug)} className="pp-sib">
                    <div className="pp-sib-shot" aria-hidden="true">
                      <div className="pp-sib-scale"><ProductScreen id={s.screen} /></div>
                    </div>
                    <span className="pp-sib-label">{s.label} <StatusTag status={s.status} /></span>
                    <span className="pp-sib-detail">{s.detail}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="pp-all rv">
            <h2 className="pp-h3">The whole product</h2>
            <div className="pp-all-grid">
              {GROUPS.map(g => (
                <div key={g}>
                  <div className="pp-all-g">{g}</div>
                  <p className="pp-all-b">{GROUP_BLURB[g]}</p>
                  <ul>
                    {PRODUCT_PAGES.filter(p => p.group === g).map(p => (
                      <li key={p.slug}>
                        <a href={productHref(p.slug)} aria-current={p === page ? 'page' : undefined}>{p.label} <StatusTag status={p.status} /></a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FinalCta />
    </div>
  )
}
