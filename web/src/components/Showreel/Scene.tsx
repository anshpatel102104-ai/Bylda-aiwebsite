import { memo, type CSSProperties } from 'react'
import { ChromeRibbon } from '../../brand/ChromeRibbon'
import { Mark, Wordmark } from '../../brand/Logo'
import { AnalysisPanel, CallBehaviors } from '../../ui/AnalysisPanel'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { FocusCard } from '../../ui/FocusCard'
import { ManagerView } from '../../ui/ManagerView'
import { PatternCard } from '../../ui/PatternCard'
import { RepBrief } from '../../ui/RepBrief'
import { ResultChart } from '../../ui/ResultChart'
import type { Frame, Variant } from './render'
import { CHAPTERS } from './timeline'

/**
 * Where each fragment sits on the fixed design canvas. The canvas is scaled to
 * fit the stage, so these numbers hold at every viewport width.
 */
const LAYOUT = {
  desktop: {
    timeline: { left: 70, top: 112, width: 960 },
    analysis: { left: 56, top: 92, width: 540 },
    behaviors: { left: 612, top: 92, width: 432 },
    profile: { left: 150, top: 74, width: 800 },
    window: { left: 70, top: 36, width: 960, height: 568 },
    brief: { left: 40, top: 30, width: 880 },
    glass: { left: 0, top: 190, width: 960, height: 378 },
    focus: { left: 110, top: 250, width: 880 },
    result: { left: 70, top: 58, width: 960 },
    pattern: { left: 48, top: 128, width: 624 },
    manager: { left: 684, top: 88, width: 356 },
    phantom: { left: 483, top: 176, width: 134 },
    wordmark: { left: 0, top: 352, width: 1100 },
    tagline: { left: 0, top: 410, width: 1100 },
    toast: { left: 742, top: 40, width: 260 },
  },
  mobile: {
    timeline: { left: 20, top: 140, width: 480 },
    analysis: { left: 20, top: 56, width: 480 },
    behaviors: { left: 20, top: 520, width: 480 },
    profile: { left: 20, top: 52, width: 480 },
    window: { left: 12, top: 40, width: 496, height: 570 },
    brief: { left: 16, top: 16, width: 464 },
    glass: { left: 0, top: 160, width: 496, height: 410 },
    focus: { left: 24, top: 216, width: 472 },
    result: { left: 20, top: 56, width: 480 },
    pattern: { left: 20, top: 40, width: 480 },
    manager: { left: 20, top: 316, width: 480 },
    phantom: { left: 202, top: 190, width: 116 },
    wordmark: { left: 0, top: 346, width: 520 },
    tagline: { left: 0, top: 398, width: 520 },
    toast: { left: 130, top: 292, width: 260 },
  },
} as const

type Box = { left: number; top: number; width: number; height?: number }
const at = (b: Box, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, ...extra })

const Backgrounds = memo(function Backgrounds({ bg }: { bg: Frame['bg'] }) {
  return (
    <>
      {bg.map(b => {
        const c = CHAPTERS[b.i]
        const black = c.env === 'black'
        return (
          <div key={b.i} className="sr-bg" data-env={c.env} data-i={b.i} style={{ opacity: b.opacity }}>
            <ChromeRibbon
              variant={c.ribbon}
              width={black ? 34 : 46}
              opacity={black ? 0.14 : 0.42}
              className="sr-ribbon"
              style={{ transform: `scale(${b.scale})` }}
            />
          </div>
        )
      })}
    </>
  )
})

export function Scene({ f, v }: { f: Frame; v: Variant }) {
  const Lo = LAYOUT[v]
  const m = v === 'mobile'
  const { p } = f
  // End-card type fades just before the push into the Phantom, so only the mark fills the frame.
  const endText = p.end.phantom * (1 - Math.min(1, Math.max(0, (f.t - 37.5) / 0.15)))
  const layer = (i: number): CSSProperties => ({
    visibility: f.layers[i].show ? 'visible' : 'hidden',
    opacity: f.layers[i].opacity,
    transform: f.layers[i].transform,
  })
  return (
    <>
      <Backgrounds bg={f.bg} />

      {/* Event */}
      <div className="sr-layer" style={layer(0)} data-env="black">
        <CallTimeline {...p.timeline} compact={m} className="f-float" style={at(Lo.timeline)} />
      </div>

      {/* Behavior */}
      <div className="sr-layer" style={layer(1)} data-env="black">
        <AnalysisPanel type={p.analysis.type} compact={m} className="f-float" style={at(Lo.analysis)} />
        {!m && <CallBehaviors {...p.behaviors} className="f-float" style={at(Lo.behaviors)} />}
      </div>

      {/* Pattern */}
      <div className="sr-layer" style={layer(2)} data-env="black">
        <BehaviorTable {...p.profile} hoverRow={p.hoverRow} compact={m} className="f-float" style={at(Lo.profile)} />
      </div>

      {/* Outcome: the team pattern, then the manager assigns coaching */}
      <div className="sr-layer" style={layer(3)} data-env="black">
        <PatternCard {...p.pattern} compact={m} className="f-float" style={at(Lo.pattern)} />
        <ManagerView {...p.manager} compact={m} className="f-float" style={at(Lo.manager)} />
        <div className="sr-toast" data-cue="toast" style={at(Lo.toast, { opacity: p.toast, transform: `translate3d(0, ${(1 - p.toast) * 10}px, 0)`, borderColor: p.toastQuiet > 0 ? 'transparent' : undefined })}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ opacity: 1 - p.toastQuiet }}>
            <circle cx="8" cy="8" r="8" fill="var(--signal-improve)" />
            <path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p.toast} />
          </svg>
          <span style={{ opacity: 1 - p.toastQuiet }}>Coaching assigned to Jordan</span>
        </div>
      </div>

      {/* Change: the rep's morning, the film's one glass moment */}
      <div className="sr-layer" style={layer(4)} data-env="black">
        <div className="sr-window f-float" style={at(Lo.window)}>
          <RepBrief style={at(Lo.brief, { opacity: p.brief.crisp })} />
          <RepBrief className="sr-blur" style={at(Lo.brief, { opacity: p.brief.blur })} />
          <div className="sr-glass" style={at(Lo.glass, { opacity: p.brief.glass })} />
        </div>
        <FocusCard
          type={p.focus.type} cols={p.focus.cols} draw={p.focus.draw} press={p.focus.press} quiet={p.focus.quiet}
          caret compact={m}
          style={at(Lo.focus, { opacity: p.focus.rise, transform: `translate3d(0, ${(1 - p.focus.rise) * 16}px, 0)` })}
        />
      </div>

      {/* Measure, then pull back to the official mark */}
      <div className="sr-layer" style={layer(5)} data-env="black">
        <div className="sr-layer" style={{ opacity: p.end.content, transform: `scale(${p.end.contentScale})`, transformOrigin: '50% 50%' }}>
          <ResultChart {...p.result} compact={m} style={at(Lo.result)} />
        </div>
        <div style={at(Lo.phantom, { opacity: p.end.phantom, transform: `translate3d(0, ${p.end.phantomY}px, 0) scale(${p.end.phantomScale})` })}>
          <Mark size={Math.round(Lo.phantom.width * 375 / 333)} style={{ width: '100%', height: 'auto' }} />
          {/* Deepest point of the Phantom's black body in the mark: the loop pushes in here. */}
          <span data-cue="phantom" style={{ position: 'absolute', left: '39.3%', top: '52%', width: 0, height: 0 }} />
        </div>
        <div style={at(Lo.wordmark, { opacity: endText, textAlign: 'center', transform: `translate3d(0, ${p.end.phantomY * 0.6}px, 0)` })}>
          <Wordmark tone="light" height={m ? 30 : 34} title={null} />
        </div>
        <div className="sr-tagline" style={at(Lo.tagline, { opacity: endText * 0.9 })}>Behavioral sales intelligence</div>
      </div>

      <HudLayer h={f.hud} />
    </>
  )
}

/** Cursor, click ring and popover. Above the camera, so it never zooms. */
function HudLayer({ h }: { h: Frame['hud'] }) {
  return (
    <div className="sr-hud">
      <span className="sr-ring" style={{ left: h.ring.x, top: h.ring.y, opacity: h.ring.opacity, transform: `translate(-50%, -50%) scale(${h.ring.scale})` }} />
      {h.tip.text && (
        <span className="sr-tip" data-align={h.tip.align} style={{ left: h.tip.x, top: h.tip.y, opacity: h.tip.opacity, transform: `translate(${h.tip.align === 'start' ? '-28px' : h.tip.align === 'end' ? 'calc(-100% + 28px)' : '-50%'}, calc(-100% - ${14 + (1 - h.tip.opacity) * 6}px))` }}>
          {h.tip.text}
        </span>
      )}
      <svg className="sr-cursor" width="22" height="26" viewBox="0 0 22 26"
        style={{ left: h.cursor.x, top: h.cursor.y, opacity: h.cursor.opacity, transform: `translate(-3px, -2px) scale(${h.cursor.press ? 0.86 : 1})` }}>
        <path d="M3 2.5v18.2l4.6-4.4 3 7 3.4-1.5-3-6.8 6.4-.2L3 2.5z" fill="#0b0b0c" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
