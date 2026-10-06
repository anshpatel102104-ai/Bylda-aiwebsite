import type { CSSProperties } from 'react'
import { CALL_BEHAVIORS, CALL_BEHAVIOR_HIGHLIGHT, WHERE_LOST } from '../data/sample'
import { clamp, ease, rise, typed } from '../lib/motion'
import { Confidence } from './parts'

/** Rebuild of Call Review, Analysis tab: "Where the call was lost" (Figma 20:1802). */

export interface AnalysisPanelProps {
  /** 0..1 observation, interpretation, do-next type in, evidence and confidence land. */
  type?: number
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function AnalysisPanel({ type = 1, compact = false, className = '', style }: AnalysisPanelProps) {
  const p = (a: number, b: number) => clamp((type - a) / (b - a))
  return (
    <div
      className={`f-card f-pad ${className}`}
      style={style}
      role="img"
      aria-label={`Where the call was lost. Observation: ${WHERE_LOST.observation} Interpretation: ${WHERE_LOST.interpretation} Do this next time: ${WHERE_LOST.doNext} Evidence at 18:42. Confidence high. ${WHERE_LOST.pattern}. Sample data.`}
    >
      <div aria-hidden="true">
        <div className="an-tabs">
          <span className="on">Analysis</span><span>Behaviors</span>{!compact && <><span>Methodology</span><span>Notes · 1</span></>}
        </div>
        <div className="f-label an-head" style={{ color: 'var(--signal-regress)' }}>Where the call was lost</div>
        <div className="an-box">
          <div className="an-line"><span className="f-label">Observation</span><span>{typed(WHERE_LOST.observation, p(0, 0.3))}</span></div>
          <div className="an-line" style={{ opacity: clamp(p(0.28, 0.32)) }}><span className="f-label">Interpretation</span><span>{typed(WHERE_LOST.interpretation, p(0.3, 0.6))}</span></div>
          <div className="an-line" style={{ opacity: clamp(p(0.58, 0.62)) }}><span className="f-label">Do this next time</span><span>{typed(WHERE_LOST.doNext, p(0.6, 0.82))}</span></div>
          <div className="an-ev" style={rise(ease(p(0.82, 0.92)), 8)}>
            <div><div className="f-mono" style={{ fontSize: 12 }}>{WHERE_LOST.evidence.time}</div><div className="f-label" style={{ marginTop: 2 }}>Evidence</div></div>
            <q>{WHERE_LOST.evidence.quote}</q>
          </div>
          <div className="an-conf" style={{ opacity: ease(p(0.9, 1)) }}>
            <Confidence level="High" />
            <span>{WHERE_LOST.pattern}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface CallBehaviorsProps {
  /** 0..1 rows cascade in. */
  rows?: number
  /** 0..1 the interruptions row takes its signal tint. */
  highlight?: number
  limit?: number
  className?: string
  style?: CSSProperties
}

/** "Behaviors on this call", same Analysis tab. */
export function CallBehaviors({ rows = 1, highlight = 1, limit, className = '', style }: CallBehaviorsProps) {
  // A limited list starts at row 1 so the highlighted interruptions row stays in view.
  const list = limit ? CALL_BEHAVIORS.slice(1, 1 + limit) : CALL_BEHAVIORS
  const h = ease(clamp(highlight))
  return (
    <div className={`f-card f-pad ${className}`} style={style} role="img"
      aria-label={`Behaviors on this call: ${CALL_BEHAVIORS.map(b => `${b.label}, ${b.value}, ${b.tag}`).join('; ')}. Sample data.`}>
      <div aria-hidden="true">
        <div className="f-label f-label-strong" style={{ marginBottom: 10 }}>Behaviors on this call</div>
        {list.map((b, i) => {
          const p = ease(clamp(rows * list.length * 1.4 - i))
          const hi = CALL_BEHAVIORS.indexOf(b) === CALL_BEHAVIOR_HIGHLIGHT
          return (
            <div key={b.label} className="cb-row" style={rise(p, 8)}>
              {hi && <span className="cb-hi" style={{ opacity: h }} />}
              <span style={{ position: 'relative' }}>{b.label}</span>
              <span className="v" style={{ position: 'relative' }}>{b.value}</span>
              <span className="f-tag" data-tone={b.tone} style={{ position: 'relative' }}>{b.tag}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
