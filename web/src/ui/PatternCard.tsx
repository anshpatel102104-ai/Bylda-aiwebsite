import type { CSSProperties } from 'react'
import { PATTERN } from '../data/sample'
import { clamp, ease, rise } from '../lib/motion'
import { Confidence } from './parts'

/** Rebuild of Behavior Detail, "Relationship with outcomes" (Figma 20:2128). */

export interface PatternCardProps {
  /** 0..1 headline lands. */
  head?: number
  /** 0..1 rows land and bars fill. */
  fill?: number
  /** 0..1 footnote lands. */
  note?: number
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function PatternCard({ head = 1, fill = 1, note = 1, compact = false, className = '', style }: PatternCardProps) {
  const rows = compact ? PATTERN.rows.slice(0, 2) : PATTERN.rows
  return (
    <div
      className={`f-card f-pad ${compact ? 'pt-compact' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`Pattern, ${PATTERN.behavior}. Next step booked in 41% of calls with an interruption during an objection (n=38) versus 72% without (n=104). ${PATTERN.footnote} Sample data.`}
    >
      <div aria-hidden="true">
        <div className="f-row">
          <span className="f-label f-label-strong">Relationship with outcomes</span>
          {!compact && <Confidence level="Medium" />}
        </div>
        <div className="pt-head" style={rise(ease(clamp(head)), 8)}>{PATTERN.headline}</div>
        <div className="pt-grid pt-colhead f-label">
          <span>Outcome</span><span>With · <span style={{ textTransform: 'none' }}>n={PATTERN.withN}</span></span><span>Without · <span style={{ textTransform: 'none' }}>n={PATTERN.withoutN}</span></span><span />{!compact && <span>Read</span>}
        </div>
        {rows.map((r, i) => {
          const p = ease(clamp(fill * rows.length * 1.3 - i))
          return (
            <div key={r.label} className="pt-grid pt-row" style={rise(clamp(p * 2), 6)}>
              <span>{r.label}</span>
              <span className="w">{r.with}%</span>
              <span className="wo">{r.without}%</span>
              <span className="pt-bars">
                <b style={{ width: `${r.with}%`, background: 'var(--signal-regress)', transform: `scaleX(${p})` }} />
                <b style={{ width: `${r.without}%`, background: 'var(--ink)', transform: `scaleX(${p})` }} />
              </span>
              {!compact && <span><span className="f-tag" data-tone="info" style={{ opacity: p }}>{r.read}</span></span>}
            </div>
          )
        })}
        {!compact && (
          <div className="pt-grid pt-row" style={rise(ease(clamp(fill * 2 - 1)), 6)}>
            <span>Closed-won</span>
            <span className="w">{PATTERN.closedWon.with}</span>
            <span className="wo">{PATTERN.closedWon.without}</span>
            <span />
            <span><span className="f-tag">{PATTERN.closedWon.read}</span></span>
          </div>
        )}
        <div style={{ ...rise(ease(clamp(note)), 6), marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="br-note">Association, not proof</span>
          {!compact && <span className="f-muted" style={{ fontSize: 12 }}>Across 142 calls. Not proof the interruption caused it.</span>}
        </div>
      </div>
    </div>
  )
}
