import { memo, type CSSProperties } from 'react'
import { ChromeRibbon } from '../../brand/ChromeRibbon'
import { Phantom } from '../../brand/Phantom'
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
    brief: { left: 110, top: 64, width: 880 },
    glass: { left: 70, top: 222, width: 960, height: 360 },
    focus: { left: 110, top: 250, width: 880 },
    result: { left: 70, top: 86, width: 960 },
    pattern: { left: 48, top: 128, width: 624 },
    manager: { left: 684, top: 88, width: 356 },
    phantom: { left: 490, top: 214, width: 120 },
    wordmark: { left: 470, top: 392, width: 160 },
  },
  mobile: {
    timeline: { left: 20, top: 140, width: 480 },
    analysis: { left: 20, top: 56, width: 480 },
    behaviors: { left: 20, top: 520, width: 480 },
    profile: { left: 20, top: 52, width: 480 },
    brief: { left: 26, top: 50, width: 468 },
    glass: { left: 12, top: 200, width: 496, height: 400 },
    focus: { left: 24, top: 216, width: 472 },
    result: { left: 20, top: 56, width: 480 },
    pattern: { left: 20, top: 40, width: 480 },
    manager: { left: 20, top: 316, width: 480 },
    phantom: { left: 205, top: 214, width: 110 },
    wordmark: { left: 185, top: 382, width: 150 },
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
          <div key={b.i} className="sr-bg" data-env={c.env} style={{ opacity: b.opacity }}>
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

export function Scene({ f, v, base }: { f: Frame; v: Variant; base: string }) {
  const Lo = LAYOUT[v]
  const m = v === 'mobile'
  const { p } = f
  const layer = (i: number): CSSProperties => ({
    visibility: f.layers[i].show ? 'visible' : 'hidden',
    opacity: f.layers[i].opacity,
    transform: f.layers[i].transform,
  })
  return (
    <>
      <Backgrounds bg={f.bg} />

      {/* 1 Observe */}
      <div className="sr-layer" style={layer(0)} data-env="black">
        <CallTimeline {...p.timeline} compact={m} className="f-float" style={at(Lo.timeline)} />
      </div>

      {/* 2 Understand */}
      <div className="sr-layer" style={layer(1)} data-env="black">
        <AnalysisPanel type={p.analysis.type} compact={m} className="f-float" style={at(Lo.analysis)} />
        {!m && <CallBehaviors {...p.behaviors} className="f-float" style={at(Lo.behaviors)} />}
      </div>

      {/* 3 Behavior profile */}
      <div className="sr-layer" style={layer(2)}>
        <BehaviorTable {...p.profile} compact={m} className="f-float" style={at(Lo.profile)} />
      </div>

      {/* 4 Recommend: the film's one glass moment */}
      <div className="sr-layer" style={layer(3)}>
        <RepBrief style={at(Lo.brief, { opacity: p.brief.crisp })} />
        <RepBrief className="sr-blur" style={at(Lo.brief, { opacity: p.brief.blur })} />
        <div className="sr-glass" style={at(Lo.glass, { opacity: p.brief.glass })} />
        <FocusCard
          type={p.focus.type} cols={p.focus.cols} draw={p.focus.draw} press={p.focus.press} quiet={p.focus.quiet}
          caret compact={m}
          style={at(Lo.focus, { opacity: p.focus.rise, transform: `translate3d(0, ${(1 - p.focus.rise) * 16}px, 0)` })}
        />
      </div>

      {/* 5 Change and measure */}
      <div className="sr-layer" style={layer(4)} data-env="black">
        <ResultChart {...p.result} compact={m} style={at(Lo.result)} />
      </div>

      {/* 6 Pattern and manager view, then the Phantom */}
      <div className="sr-layer" style={layer(5)}>
        <div className="sr-layer" style={{ opacity: p.end.content, transform: `scale(${p.end.contentScale})`, transformOrigin: '50% 50%' }}>
          <PatternCard {...p.pattern} compact={m} className="f-float" style={at(Lo.pattern)} />
          <ManagerView {...p.manager} compact={m} className="f-float" style={at(Lo.manager)} />
        </div>
        <div style={at(Lo.phantom, { opacity: p.end.phantom, transform: `translate3d(0, ${p.end.phantomY}px, 0) scale(${p.end.phantomScale})` })}>
          <Phantom style={{ width: '100%', height: 'auto' }} />
          <span data-cam="phantom" style={{ position: 'absolute', left: '38%', top: '58%', width: 0, height: 0 }} />
        </div>
        <img
          src={`${base}brand/bylda-wordmark-ink.png`} alt="" width={Lo.wordmark.width} height={Math.round(Lo.wordmark.width * 129 / 560)}
          style={at(Lo.wordmark, { opacity: p.end.phantom * (1 - Math.min(1, Math.max(0, (f.t - 37.55) / 0.15))) })}
        />
      </div>
    </>
  )
}
