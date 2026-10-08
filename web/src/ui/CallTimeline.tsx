import type { CSSProperties } from 'react'
import { CALL, CALL_EVENTS, CALL_STAGES } from '../data/sample'
import { clamp, countTo, ease, rise } from '../lib/motion'

/** Rebuild of the Call Review timeline (Figma, Prototypes F 4078:64367). */

const pct = (s: number) => `${(s / CALL.durationSec) * 100}%`
export const MARKER_FRAC = CALL.marker.sec / CALL.durationSec

// Talk lane: rep (top, navy) and prospect (bottom, silver) turns. Shape traced
// from the screen: balanced through discovery, rep dominates after 18:42.
const TURNS: ReadonlyArray<[number, number, 'rep' | 'pro']> = (() => {
  const out: Array<[number, number, 'rep' | 'pro']> = []
  let t = 0
  let i = 0
  while (t < CALL.durationSec) {
    const after = t > CALL.marker.sec
    const rep = i % 2 === 0
    const base = rep ? (after ? 150 : 52) : (after ? 34 : 70)
    const jitter = ((Math.sin(i * 7.31) + 1) / 2) * base * 0.8
    const len = Math.min(base + jitter, CALL.durationSec - t)
    out.push([t, len, rep ? 'rep' : 'pro'])
    t += len + 6
    i++
  }
  return out
})()

const CONTROL = [0.55, 0.55, 0.5, 0.48, 0.45, 0.44, 0.42, 0.42, 0.4, 0.4, 0.45, 0.62, 0.62, 0.61, 0.6, 0.6, 0.6, 0.61, 0.6, 0.6]
const SENTIMENT = [0.58, 0.56, 0.55, 0.55, 0.54, 0.54, 0.52, 0.52, 0.52, 0.5, 0.5, 0.55, 0.6, 0.66, 0.7, 0.74, 0.76, 0.76, 0.75, 0.75]
const line = (vals: ReadonlyArray<number>) =>
  vals.map((v, i) => `${i ? 'L' : 'M'}${((i / (vals.length - 1)) * 1000).toFixed(1)} ${(v * 36).toFixed(1)}`).join(' ')

export interface CallTimelineProps {
  /** 0..1 lanes unfold left to right, one after another. */
  lanes?: number
  /** 0..1 event markers pop in. */
  events?: number
  /** 0..1 summary metrics count and settle (talk/listen 50/50 to 61/39). */
  metrics?: number
  /** 0..1 playhead travels to 18:42 and the marker chip drops in. */
  marker?: number
  /** 0..1 chip label fades (the camera is pushing into the chip). */
  quiet?: number
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function CallTimeline({
  lanes = 1, events = 1, metrics = 1, marker = 1, quiet = 0, compact = false, className = '', style,
}: CallTimelineProps) {
  const laneP = (k: number) => ease(clamp(lanes * 5 - k * 0.8))
  const m = ease(clamp(marker * 1.6))
  const head = clamp(marker * 1.6) // playhead travel
  const chip = ease(clamp(marker * 2.2 - 1.2))
  const talk = Number(countTo(CALL.talk, metrics, 0, 50))
  const q = 1 - clamp(quiet)
  return (
    <div
      className={`f-card f-pad ${className}`}
      style={style}
      role="img"
      aria-label={`Call review of ${CALL.title}, ${CALL.duration} long. Pricing objection at ${CALL.marker.time}. Talk ${CALL.talk}, listen ${CALL.listen}. Interruptions ${CALL.interruptions}. Next step: none set. Sample data.`}
    >
      <div aria-hidden="true">
        <div className="ct-top" style={{ gridTemplateColumns: compact ? '1fr' : undefined }}>
          <div>
            <div className="f-label">Calls / Needs review / Acme Logistics</div>
            <div className="ct-title" style={{ marginTop: 10, fontSize: compact ? 20 : undefined }}>{CALL.title}</div>
            <div className="ct-meta f-mono">
              <span>{CALL.rep}</span><span>{CALL.date}</span><span>{CALL.duration}</span>
              {!compact && <span>{CALL.kind}</span>}
              <span className="f-tag" data-tone="attention">{CALL.status}</span>
            </div>
          </div>
          {!compact && (
            <div className="ct-metrics" style={{ opacity: clamp(metrics * 3) }}>
              <span>Talk / listen</span><b>{talk} / {100 - talk}</b>
              <span>Interruptions</span><b className="bad">{CALL.interruptions}</b>
              <span>Longest monologue</span><b style={{ color: 'var(--app-plum)' }}>{CALL.monologue}</b>
              <span>Next step</span><b className="bad">{CALL.nextStep}</b>
            </div>
          )}
        </div>

        <div className="ct-panel">
          <div className="ct-bar">
            <span className="ct-play" />
            <span className="f-mono" style={{ fontSize: 13 }}>
              {head > 0 ? CALL.marker.time : '00:00'} / {CALL.duration}
            </span>
            {!compact && (
              <div className="ct-legend" style={{ opacity: clamp(events * 2) * (1 - chip * 0.85) }}>
                <span><i className="ct-ev" data-k="objection" style={{ position: 'static', margin: 0 }} />objection</span>
                <span style={{ color: 'var(--signal-regress)' }}>| interruption</span>
                <span style={{ color: 'var(--graphite-700)' }}>&#9644; monologue</span>
                <span style={{ color: 'var(--signal-info)' }}>&#8226; question</span>
                <span>&#10003; positive</span>
              </div>
            )}
          </div>

          <div className="ct-lanes">
            <div>
              {['Stage', 'Events', 'Talk', 'Control', 'Sentiment'].map(l => (
                <div key={l} className="ct-lane-label">{l.toUpperCase()}</div>
              ))}
            </div>
            <div className="ct-tracks">
              {/* Stage */}
              <div className="ct-track ct-reveal" style={{ transform: `scaleX(${laneP(0)})`, opacity: laneP(0) }}>
                {CALL_STAGES.map((s, i) => (
                  <div key={i} className={`ct-stage ${s.hot ? 'hot' : ''}`}
                    style={{ left: pct(s.from), width: `calc(${pct(s.to - s.from)} - 3px)`, opacity: s.label ? 1 : 0.6 }}>
                    {compact && s.label.startsWith('Close') ? 'Close' : s.label}
                  </div>
                ))}
              </div>
              {/* Events */}
              <div className="ct-track">
                <div className="ct-reveal" style={{ position: 'absolute', inset: 0, transform: `scaleX(${laneP(1)})`, opacity: laneP(1) * 0.9 }}>
                  <svg className="ct-svg" viewBox="0 0 1000 36" preserveAspectRatio="none">
                    <line x1="0" x2="1000" y1="18" y2="18" stroke="var(--silver-200)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
                {CALL_EVENTS.map((e, i) => {
                  const p = ease(clamp(events * CALL_EVENTS.length * 1.5 - i * 1.2))
                  return <i key={i} className="ct-ev" data-k={e.kind} style={{ left: pct(e.sec), opacity: p, scale: `${0.3 + 0.7 * p}` }} />
                })}
              </div>
              {/* Talk */}
              <div className="ct-track ct-reveal" style={{ transform: `scaleX(${laneP(2)})`, opacity: laneP(2) }}>
                <svg className="ct-svg" viewBox={`0 0 ${CALL.durationSec} 36`} preserveAspectRatio="none">
                  {TURNS.map(([t, len, who], i) => (
                    <rect key={i} x={t} width={len} y={who === 'rep' ? 10 : 19} height={7}
                      fill={who === 'rep' ? 'var(--app-navy-solid)' : 'var(--silver-300)'} />
                  ))}
                </svg>
              </div>
              {/* Control */}
              <div className="ct-track ct-reveal" style={{ transform: `scaleX(${laneP(3)})`, opacity: laneP(3) }}>
                <svg className="ct-svg" viewBox="0 0 1000 36" preserveAspectRatio="none">
                  <path d={line(CONTROL)} fill="none" stroke="var(--ink)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                </svg>
                {!compact && <span className="ct-note" style={{ left: '16%', top: -2 }}>prospect leads</span>}
              </div>
              {/* Sentiment */}
              <div className="ct-track ct-reveal" style={{ transform: `scaleX(${laneP(4)})`, opacity: laneP(4) }}>
                <svg className="ct-svg" viewBox="0 0 1000 36" preserveAspectRatio="none">
                  <path d={line(SENTIMENT)} fill="none" stroke="var(--signal-info)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                </svg>
                {!compact && <span className="ct-note" style={{ left: '58%', top: -4, color: 'var(--signal-regress)' }}>rep pushing</span>}
                {!compact && <span className="ct-note" style={{ left: '72%', top: 26, color: 'var(--signal-info)' }}>prospect cooling</span>}
              </div>

              {/* Playhead and 18:42 marker */}
              <span className="ct-playhead" style={{ left: `${MARKER_FRAC * 100 * head}%`, opacity: clamp(marker * 6) }} />
              <span className="ct-playhead-l f-mono" style={{ left: `${MARKER_FRAC * 100}%`, opacity: m * (1 - chip) }}>{CALL.marker.time}</span>
              <span data-cue="marker" style={{ position: 'absolute', left: `${MARKER_FRAC * 100}%`, top: -41, width: 0, height: 0 }} />
              <div className="ct-chip" style={{ left: `${MARKER_FRAC * 100}%`, opacity: chip, transform: `translate3d(0, ${(1 - chip) * -12}px, 0)` }}>
                <span className="k" style={{ opacity: q }} />
                <span className="f-mono" style={{ opacity: q, fontSize: 12 }}>{CALL.marker.time}</span>
                <span style={{ opacity: q }}>{CALL.marker.label}</span>
              </div>
            </div>
          </div>
          <div className="ct-axis" style={rise(laneP(4), 4)}>
            {[0, 600, 1200, 1800].map(s => (
              <span key={s} style={{ left: pct(s) }}>{`${s / 60}:00`}</span>
            ))}
            <span style={{ left: '100%', translate: '-100% 0' }}>{CALL.duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
