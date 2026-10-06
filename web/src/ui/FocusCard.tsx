import { useId, type CSSProperties } from 'react'
import { FOCUS } from '../data/sample'
import { clamp, ease, rise, typed } from '../lib/motion'

/** Rebuild of Rep Home, "Today's focus" card (Figma 20:2362). */

export interface FocusCardProps {
  /** 0..1 the focus sentence types in. */
  type?: number
  /** 0..1 the three columns land. */
  cols?: number
  /** 0..1 the pause sparkline draws toward the 1.5s target. */
  draw?: number
  /** 0..1 primary button hover then press. */
  press?: number
  /** 0..1 everything except the primary button fades (camera push). */
  quiet?: number
  caret?: boolean
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function FocusCard({ type = 1, cols = 1, draw = 1, press = 0, quiet = 0, caret = false, compact = false, className = '', style }: FocusCardProps) {
  const q = 1 - clamp(quiet)
  const clip = `fc${useId().replace(/:/g, '')}`
  const c = (i: number) => ease(clamp(cols * 3 - i))
  const pr = ease(clamp(press))
  return (
    <div
      className={`fc ${compact ? 'fc-compact' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`Today's focus: ${FOCUS.text} ${FOCUS.assigned}. Why it matters: ${FOCUS.why} Try this next time: ${FOCUS.tryNext} Your pause after objections: 0.4 seconds, 1.5 second target. Sample data.`}
    >
      <div aria-hidden="true">
        <div className="f-row" style={{ opacity: q }}>
          <span className="f-label" style={{ color: 'var(--pearl-0)', fontWeight: 600 }}>Today&rsquo;s focus</span>
          {!compact && <span className="f-label">{FOCUS.assigned}</span>}
        </div>
        <div className="fc-head" style={{ opacity: q }}>
          {typed(FOCUS.text, type)}
          {caret && type > 0 && type < 1 && <span className="fc-caret" />}
        </div>
        <div className="fc-cols" style={{ opacity: q }}>
          {!compact && (
            <div style={rise(c(0), 8)}>
              <div className="f-label">Why it matters</div>
              <p>{FOCUS.why}</p>
            </div>
          )}
          <div style={rise(c(compact ? 0 : 1), 8)}>
            <div className="f-label">Try this next time</div>
            <p>{FOCUS.tryNext}</p>
          </div>
          <div style={rise(c(compact ? 1 : 2), 8)}>
            <div className="f-label">Your pause after objections</div>
            <div className="fc-big">{FOCUS.pause.from}s <small>&rarr; {FOCUS.pause.to}s target</small></div>
            <svg width="150" height="22" viewBox="0 0 150 22" style={{ marginTop: 10, overflow: 'visible' }}>
              <defs>
                <clipPath id={clip}><rect x="-2" y="-4" width="154" height="30" style={{ transform: `scaleX(${clamp(draw)})`, transformOrigin: '0 0' }} /></clipPath>
              </defs>
              <path d="M0 19 L28 15 L58 16 L86 14 L112 11 L150 2" fill="none" stroke="#d9d6d0" strokeWidth="1.3" clipPath={`url(#${clip})`} />
            </svg>
          </div>
        </div>
        <div className="fc-actions">
          <span className="fc-primary" data-cam="gotit"
            style={{ transform: `scale(${1 + pr * 0.03 - (pr > 0.6 ? (pr - 0.6) * 0.12 : 0)})` }}>
            <span style={{ opacity: q }}>{FOCUS.primary}</span>
          </span>
          <span className="fc-secondary" style={{ opacity: q }}>{FOCUS.secondary}</span>
        </div>
      </div>
    </div>
  )
}
