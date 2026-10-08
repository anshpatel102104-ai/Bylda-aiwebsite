import type { CSSProperties } from 'react'
import { PROFILE, PROFILE_META } from '../data/sample'
import { clamp, countTo, rise } from '../lib/motion'
import { Spark } from './parts'

/** Rebuild of Rep Profile, "Behavior profile · 30 days" (Figma, Prototypes F 4078:63917). */

const sparkColor = { improve: 'var(--signal-improve)', regress: 'var(--signal-regress)', attention: 'var(--signal-regress)', neutral: 'var(--silver-500)', info: 'var(--signal-info)' }

export interface BehaviorTableProps {
  /** 0..1 rows cascade in. */
  cascade?: number
  /** 0..1 values count up. */
  count?: number
  /** 0..1 eight-week sparklines draw. */
  draw?: number
  /** 0..1 tags land. */
  tags?: number
  /** 0..1 hover state on the interruptions row (the showreel cursor rests on its tag). */
  hoverRow?: number
  /** Show only the first n rows. */
  limit?: number
  /** Drop the person header and the sparkline column. */
  compact?: boolean
  bare?: boolean
  className?: string
  style?: CSSProperties
}

export function BehaviorTable({ cascade = 1, count = 1, draw = 1, tags = 1, hoverRow = 0, limit, compact = false, bare = false, className = '', style }: BehaviorTableProps) {
  const rows = limit ? PROFILE.slice(0, limit) : PROFILE
  return (
    <div
      className={`f-card ${bare ? '' : 'f-pad'} ${compact ? 'bp-compact' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`Behavior profile for Jordan Reyes, 30 days, Jordan versus team: ${rows.map(r => `${r.label} ${r.rep} vs ${r.team}, ${r.tag}`).join('; ')}. Sample data.`}
    >
      <div aria-hidden="true">
        {!bare && (
          <div className="bp-person">
            <span className="f-av">JR</span>
            <div>
              <div className="bp-name">Jordan Reyes</div>
              <div className="f-mono f-muted" style={{ fontSize: 11, marginTop: 6 }}>{PROFILE_META}</div>
            </div>
          </div>
        )}
        <div className="bp-table" style={bare ? { marginTop: 0, border: 0 } : undefined}>
          <div className="bp-cap">
            <span className="f-label f-label-strong">Behavior profile · 30 days</span>
            {!compact && <span className="f-mono f-muted" style={{ fontSize: 10 }}>vs team median · vs his own baseline</span>}
          </div>
          <div className="bp-grid bp-colhead f-label">
            <span>Behavior</span><span>Jordan</span><span>Team</span>{!compact && <span>8 weeks</span>}<span />
          </div>
          {rows.map((r, i) => {
            const p = clamp(cascade * rows.length * 1.3 - i)
            const bad = r.tag === 'Leak'
            const num = countTo(r.repNum, count, r.repDecimals ?? 0)
            return (
              <div key={r.label} className="bp-grid bp-row" style={{ ...rise(p, 8), position: 'relative' }}>
                {r.label.startsWith('Interruptions') && <span className="bp-hover" style={{ opacity: hoverRow }} />}
                <span>{r.label}</span>
                <span className={`rep ${bad ? 'bad' : ''}`}>{count >= 1 ? r.rep : `${num}${r.repSuffix ?? ''}`}</span>
                <span className="team">{r.team}</span>
                {!compact && <span><Spark values={r.spark} color={sparkColor[r.tone]} draw={clamp(draw * 1.4 - i * 0.05)} /></span>}
                <span style={{ opacity: clamp(tags * rows.length - i * 0.8) }}>
                  <span className="f-tag" data-tone={r.tone === 'neutral' ? undefined : r.tone} data-cue={r.label.startsWith('Interruptions') ? 'leak' : undefined}>{r.tag}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
