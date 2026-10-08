import type { CSSProperties } from 'react'
import { MANAGER } from '../data/sample'
import { clamp, ease, rise } from '../lib/motion'
import { Confidence } from './parts'

/** Rebuild of Manager Home feed: top insight and "Coach today" (Figma, Prototypes F 4079:3546). */

export interface ManagerViewProps {
  /** 0..1 the insight lands. */
  insight?: number
  /** 0..1 coach-today rows cascade. */
  rows?: number
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function ManagerView({ insight = 1, rows = 1, compact = false, className = '', style }: ManagerViewProps) {
  const list = compact ? MANAGER.coachToday.slice(0, 2) : MANAGER.coachToday
  const ins = ease(clamp(insight))
  return (
    <div
      className={`f-card f-pad ${className}`}
      style={style}
      role="img"
      aria-label={`Manager home. ${MANAGER.insight} Coach today: ${MANAGER.coachToday.map(c => `${c.name}, ${c.focus}, ${c.why}`).join('; ')}. Sample data.`}
    >
      <div aria-hidden="true">
        <div style={rise(ins, 8)}>
          <div className="f-row">
            <span className="f-label f-label-strong">Bylda · Today 8:04 AM</span>
          </div>
          <div className="mg-insight">{MANAGER.insight}</div>
          {!compact && <div className="mg-body">{MANAGER.insightBody}</div>}
          {!compact && (
            <>
              <div style={{ marginTop: 10 }}><Confidence level="High" /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <span className="f-btn f-btn-ink">View pattern</span>
                <span className="f-btn" data-cue="assign">Assign coaching</span>
              </div>
            </>
          )}
        </div>
        <div className="f-hair" style={{ marginTop: compact ? 14 : 18, paddingTop: 14 }}>
          <div className="f-label f-label-strong">Coach today</div>
          {list.map((c, i) => {
            const p = ease(clamp(rows * list.length * 1.4 - i))
            return (
              <div key={c.name} className="mg-row" data-cue={i === 0 ? 'coachrow' : undefined} style={rise(p, 8)}>
                <span className="f-av">{c.initials}</span>
                <div>
                  <div className="n">{c.name}: {c.focus}</div>
                  <div className="w">{c.why}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
