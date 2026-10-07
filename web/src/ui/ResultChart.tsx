import { useId, type CSSProperties } from 'react'
import { RESULT } from '../data/sample'
import { clamp, countTo, ease, rise } from '../lib/motion'
import { Confidence } from './parts'

/** Rebuild of Behavior Change Result: Alex Morgan (Figma 20:2279). */

const W = 640
const H = 210
const Y0 = 42
const Y1 = 76
const y = (v: number) => H - 20 - ((v - Y0) / (Y1 - Y0)) * (H - 34)
const SPLIT = 300
const bx = (i: number) => 18 + (i / (RESULT.before.length - 1)) * (SPLIT - 42)
const ax = (i: number) => SPLIT + 20 + (i / (RESULT.after.length - 1)) * (W - SPLIT - 30)

export interface ResultChartProps {
  /** 0..1 headline lands. */
  head?: number
  /** 0..1 before dots appear left to right. */
  before?: number
  /** 0..1 the focus-assigned line drops. */
  focus?: number
  /** 0..1 after dots appear. */
  after?: number
  /** 0..1 median lines draw. */
  medians?: number
  /** 0..1 result rows land; the first row counts 65% to 51%. */
  rows?: number
  /** 0..1 "Association, not proof" lands. */
  note?: number
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function ResultChart({
  head = 1, before = 1, focus = 1, after = 1, medians = 1, rows = 1, note = 1, compact = false, className = '', style,
}: ResultChartProps) {
  const id = useId().replace(/:/g, '')
  const m = ease(clamp(medians))
  const f = ease(clamp(focus))
  const list = compact ? RESULT.rows.slice(0, 2) : RESULT.rows
  return (
    <div
      className={className}
      style={{ ...style, display: 'grid', gap: 14 }}
      role="img"
      aria-label={`Behavior change result for ${RESULT.rep}: ${RESULT.headline} Talk share during objections fell from a median of 65% before the focus to 51% after, across 21 calls. Association, not proof. Sample data.`}
    >
      <div aria-hidden="true" style={{ display: 'contents' }}>
        <div style={rise(ease(clamp(head)), 10)}>
          <div className="f-row" style={{ alignItems: 'flex-start' }}>
            <div className="br-head" style={{ color: 'var(--text)', fontSize: compact ? 21 : undefined }}>{RESULT.headline}</div>
            {!compact && <span className="f-tag" data-tone="improve" style={{ marginTop: 8 }}>{RESULT.held}</span>}
          </div>
          {!compact && <div className="br-focus" style={{ color: 'var(--text-2)' }}>{RESULT.focus}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 270px', gap: 14 }}>
          <div className="f-card f-pad" style={{ padding: '18px 20px' }}>
            <div className="f-label">{RESULT.chartLabel}</div>
            <div className="br-chart" style={{ height: compact ? 180 : undefined, marginTop: 10 }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <defs>
                  <clipPath id={`${id}b`}><rect x="0" y="0" width={SPLIT} height={H} style={{ transform: `scaleX(${m})`, transformOrigin: '0 0' }} /></clipPath>
                  <clipPath id={`${id}a`}><rect x={SPLIT} y="0" width={W - SPLIT} height={H} style={{ transform: `scaleX(${m})`, transformOrigin: `${SPLIT}px 0` }} /></clipPath>
                </defs>
                <rect x={SPLIT} y={8} width={W - SPLIT} height={H - 28} fill="var(--signal-improve-bg)" style={{ opacity: ease(clamp(after * 2)) * 0.8 }} />
                {[75, 65, 55, 45].map(v => (
                  <g key={v}>
                    <line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="var(--silver-200)" vectorEffect="non-scaling-stroke" />
                    <text x="-6" y={y(v) + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--silver-600)">{v}%</text>
                  </g>
                ))}
                <g clipPath={`url(#${id}b)`}>
                  <line x1="0" x2={SPLIT - 16} y1={y(RESULT.medianBefore)} y2={y(RESULT.medianBefore)} stroke="var(--silver-600)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                </g>
                <g clipPath={`url(#${id}a)`}>
                  <line x1={SPLIT + 10} x2={W} y1={y(RESULT.medianAfter)} y2={y(RESULT.medianAfter)} stroke="var(--signal-improve)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                </g>
                <line x1={SPLIT} x2={SPLIT} y1={4} y2={H - 10} stroke="var(--ink)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
                  style={{ transform: `scaleY(${f})`, transformOrigin: `${SPLIT}px 4px` }} />
                {RESULT.before.map((v, i) => {
                  const p = ease(clamp(before * RESULT.before.length * 1.3 - i))
                  return <circle key={`b${i}`} cx={bx(i)} cy={y(v)} r="3.4" fill="var(--silver-500)" style={{ opacity: p }} />
                })}
                {RESULT.after.map((v, i) => {
                  const p = ease(clamp(after * RESULT.after.length * 1.3 - i))
                  return <circle key={`a${i}`} cx={ax(i)} cy={y(v)} r="3.4" fill="var(--signal-improve)" style={{ opacity: p }} />
                })}
              </svg>
              <span className="f-mono" style={{ position: 'absolute', left: `${(SPLIT / W) * 100}%`, top: -8, marginLeft: 6, fontSize: 10, opacity: f }}>{RESULT.assigned}</span>
              <span className="f-mono f-muted" style={{ position: 'absolute', left: 4, top: `${(y(RESULT.medianBefore) / H) * 100}%`, marginTop: 4, fontSize: 9.5, opacity: m }}>before · median 65%</span>
              <span className="f-mono" style={{ position: 'absolute', left: `${(SPLIT / W) * 100}%`, top: `${(y(RESULT.medianAfter) / H) * 100}%`, margin: '4px 0 0 14px', fontSize: 9.5, color: 'var(--signal-improve)', opacity: m }}>after · median 51%</span>
            </div>
            {!compact && <div className="f-muted" style={{ fontSize: 12.5, marginTop: 12 }}>{RESULT.caption}</div>}
          </div>

          <div className="f-card f-pad" style={{ padding: '18px 20px' }}>
            <div className="f-label f-label-strong">Result</div>
            {list.map((r, i) => {
              const p = ease(clamp(rows * list.length * 1.3 - i))
              return (
                <div key={r.label} className="br-res-row" style={rise(p, 6)}>
                  <div>{r.label}</div>
                  <div className="d">
                    {r.from} &rarr; {i === 0 ? `${countTo(51, clamp(rows * 1.6), 0, 65)}%` : r.to}
                  </div>
                </div>
              )
            })}
            {!compact && (
              <div style={{ marginTop: 10, opacity: ease(clamp(rows * 2 - 1)) }}>
                <Confidence level="High" />
                <div className="f-mono f-muted" style={{ fontSize: 9.5, marginTop: 6, lineHeight: 1.45 }}>{RESULT.confidence}</div>
              </div>
            )}
          </div>
        </div>
        <div style={rise(ease(clamp(note)), 6)}>
          <span className="br-note" data-cue="note">Association, not proof</span>
        </div>
      </div>
    </div>
  )
}
