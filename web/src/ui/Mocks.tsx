import type { CSSProperties, ReactNode } from 'react'
import { CALL, FOCUS, MANAGER, PATTERN, PROFILE, RESULT, WHERE_LOST, type Tone } from '../data/sample'
import { clamp, ease, rise, seg } from '../lib/motion'

/**
 * Screens for product pages that have no app prototype to trace: the assign
 * panel, roadmap reports and the concepts. Each is built from the sample data
 * the rest of the site uses and carries an "Illustrative" label. Every part
 * takes a progress p (0..1) so it can play its intro like the tour screens.
 */

interface MockProps { p?: number; className?: string; style?: CSSProperties }

const Illustrative = () => <span className="f-tag mk-illus">Illustrative</span>

function Field({ label, children, p }: { label: string; children: ReactNode; p: number }) {
  return (
    <div className="mk-field" style={rise(ease(clamp(p)), 8)}>
      <span className="f-label">{label}</span>
      <span className="mk-val">{children}</span>
    </div>
  )
}

/** Manager side of coaching: pick the behavior, attach the moment, set the window. */
export function AssignCard({ p = 1, className = '', style }: MockProps) {
  const f = (i: number) => seg(p, i * 0.12, i * 0.12 + 0.3)
  const press = seg(p, 0.78, 0.95)
  return (
    <div className={`f-card f-pad mk-assign ${className}`} style={style} aria-hidden="true">
      <div className="f-row">
        <span className="f-label f-label-strong">Assign coaching</span>
        <Illustrative />
      </div>
      <Field label="Rep" p={f(0)}><span className="f-av">JR</span>{CALL.rep}</Field>
      <Field label="Behavior" p={f(1)}>Objection handling <span className="f-tag" data-tone="regress">Leak</span></Field>
      <Field label="Focus" p={f(2)}>{FOCUS.text}</Field>
      <Field label="Evidence" p={f(3)}><span className="f-mono mk-time">{CALL.marker.time}</span>Acme Logistics, {CALL.marker.label}</Field>
      <Field label="Window" p={f(4)}>10 days · pause {FOCUS.pause.from}s to {FOCUS.pause.to}s</Field>
      <div className="mk-actions" style={{ opacity: ease(seg(p, 0.6, 0.75)) }}>
        <span className="f-btn">Cancel</span>
        <span className="f-btn f-btn-ink" style={{ transform: `scale(${1 - Math.sin(press * Math.PI) * 0.04})` }}>
          {press >= 1 ? 'Assigned' : 'Assign to Jordan'}
        </span>
      </div>
    </div>
  )
}

/** Roadmap: the weekly report, rolled up from results, profiles and the coach queue. */
export function WeeklyReport({ p = 1, className = '', style }: MockProps) {
  const col = (i: number) => ease(seg(p, 0.15 + i * 0.18, 0.45 + i * 0.18))
  const jordan = PROFILE[4]
  const discount = PROFILE[6]
  return (
    <div className={`f-card f-pad mk-report ${className}`} style={style} aria-hidden="true">
      <div className="f-row" style={rise(ease(seg(p, 0, 0.2)), 6)}>
        <div>
          <div className="f-label">Weekly report · Mid-Market team</div>
          <div className="mk-title">Week of Sep 28</div>
        </div>
        <span style={{ display: 'flex', gap: 6 }}>
          <span className="status-tag" data-status="roadmap">Roadmap</span>
          <Illustrative />
        </span>
      </div>
      <div className="mk-cols">
        <section style={rise(col(0), 10)}>
          <div className="f-label f-label-strong mk-col-h"><i style={{ background: 'var(--signal-improve)' }} />What held</div>
          <div className="mk-item">
            <div className="mk-item-h">{RESULT.rep} <span className="f-tag" data-tone="improve">{RESULT.held}</span></div>
            <div className="mk-item-b">{RESULT.rows[0].label}</div>
            <div className="mk-delta f-mono">{RESULT.rows[0].from} <span>→</span> {RESULT.rows[0].to}</div>
          </div>
          <div className="mk-item">
            <div className="mk-item-b">{RESULT.rows[2].label}</div>
            <div className="mk-delta f-mono">{RESULT.rows[2].from} <span>→</span> {RESULT.rows[2].to}</div>
          </div>
        </section>
        <section style={rise(col(1), 10)}>
          <div className="f-label f-label-strong mk-col-h"><i style={{ background: 'var(--signal-regress)' }} />What slipped</div>
          <div className="mk-item">
            <div className="mk-item-h">{CALL.rep} <span className="f-tag" data-tone="regress">{jordan.tag}</span></div>
            <div className="mk-item-b">{jordan.label}</div>
            <div className="mk-delta f-mono">{jordan.rep} <small>team {jordan.team}</small></div>
          </div>
          <div className="mk-item">
            <div className="mk-item-b">{discount.label}</div>
            <div className="mk-delta f-mono">{discount.rep} <small>team {discount.team}</small></div>
          </div>
        </section>
        <section style={rise(col(2), 10)}>
          <div className="f-label f-label-strong mk-col-h"><i style={{ background: 'var(--ink)' }} />Coach next</div>
          {MANAGER.coachToday.map(c => (
            <div key={c.name} className="mk-row">
              <span className="f-av">{c.initials}</span>
              <span><b>{c.name}: {c.focus}</b><small>{c.why}</small></span>
            </div>
          ))}
        </section>
      </div>
      <div className="mk-foot f-mono" style={{ opacity: ease(seg(p, 0.8, 1)) }}>{RESULT.confidence}</div>
    </div>
  )
}

type Cell = 'Strength' | 'Watch' | 'Leak' | 'Rushed'
const TONE: Record<Cell, Tone> = { Strength: 'improve', Watch: 'neutral', Leak: 'regress', Rushed: 'attention' }
const REPS = ['JR', 'AM', 'MK', 'SL', 'TB'] as const
/** Jordan's column is his real profile. The other four columns are illustrative. */
const OTHERS: ReadonlyArray<ReadonlyArray<Cell>> = [
  ['Watch', 'Leak', 'Strength', 'Strength'],
  ['Strength', 'Leak', 'Watch', 'Strength'],
  ['Strength', 'Watch', 'Strength', 'Watch'],
  ['Leak', 'Strength', 'Watch', 'Strength'],
  ['Watch', 'Strength', 'Watch', 'Leak'],
  ['Strength', 'Strength', 'Watch', 'Watch'],
  ['Strength', 'Watch', 'Leak', 'Leak'],
  ['Watch', 'Strength', 'Strength', 'Rushed'],
]
export const TEAM_ROW = 6

/** Roadmap: behaviors by rep, colored by tag against the team median. */
export function TrendsHeatmap({ p = 1, className = '', style }: MockProps) {
  const ring = ease(seg(p, 0.82, 0.95))
  return (
    <div className={`f-card f-pad mk-heat ${className}`} style={style} aria-hidden="true">
      <div className="f-row" style={rise(ease(seg(p, 0, 0.15)), 6)}>
        <div>
          <div className="f-label">Team trends · last 4 weeks · vs team median</div>
          <div className="mk-title">Behaviors across the team</div>
        </div>
        <span style={{ display: 'flex', gap: 6 }}>
          <span className="status-tag" data-status="roadmap">Roadmap</span>
          <Illustrative />
        </span>
      </div>
      <div className="mk-heat-grid">
        <span />
        {REPS.map((r, i) => <span key={r} className="mk-heat-rep" data-real={i === 0 || undefined}><span className="f-av">{r}</span></span>)}
        {PROFILE.map((row, ri) => (
          <div key={row.label} className="mk-heat-row" data-ring={ri === TEAM_ROW || undefined} style={{ ['--ring' as string]: ring }}>
            <span className="mk-heat-label">{row.label}</span>
            {[row.tag as Cell, ...OTHERS[ri]].map((c, ci) => {
              const v = ease(seg(p, 0.12 + (ri + ci) * 0.045, 0.3 + (ri + ci) * 0.045))
              return (
                <span key={ci} className="mk-cell" data-tone={TONE[c]} style={{ opacity: v, transform: `scale(${0.7 + v * 0.3})` }}>{c}</span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mk-foot" style={{ opacity: ring }}>
        <span className="mk-callout">A row of Leak is a team habit. Early discounting shows on 3 of 5 reps.</span>
        <span className="f-mono">Only JR is read off the app. Other columns are illustrative.</span>
      </div>
    </div>
  )
}

/** Concept: a buyer model built from the buyer side of the call. */
export function BuyerCard({ p = 1, className = '', style }: MockProps) {
  const b = (i: number) => ease(seg(p, 0.15 + i * 0.2, 0.45 + i * 0.2))
  return (
    <div className={`mk-buyers ${className}`} style={style} aria-hidden="true">
      <div className="f-card mk-ghost mk-ghost-2" />
      <div className="f-card mk-ghost mk-ghost-1" />
      <div className="f-card f-pad mk-buyer">
        <div className="f-row" style={rise(ease(seg(p, 0, 0.2)), 6)}>
          <div>
            <div className="f-label">Buyer model</div>
            <div className="mk-title">CFO · Mid-market logistics</div>
          </div>
          <span style={{ display: 'flex', gap: 6 }}>
            <span className="status-tag" data-status="concept">Concept</span>
            <Illustrative />
          </span>
        </div>
        <div className="mk-says" style={rise(b(0), 10)}>
          <div><span className="f-label">Says</span><b>Price</b></div>
          <span className="mk-arrow">→</span>
          <div><span className="f-label">Means</span><b>Adoption risk</b></div>
        </div>
        <blockquote className="mk-quote" style={rise(b(0), 10)}>
          <span className="f-mono mk-time">{WHERE_LOST.evidence.time}</span>{WHERE_LOST.evidence.quote}
        </blockquote>
        <div className="mk-two">
          <div style={rise(b(1), 10)}>
            <div className="f-label">Responds to</div>
            <p>One question before an answer. Reps who hold these calls pause about 1.8s first.</p>
          </div>
          <div style={rise(b(2), 10)}>
            <div className="f-label">Avoid</div>
            <p>An early discount. It answers a question this buyer did not ask.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Concept: simulate a change from observed patterns, then run it as an experiment. */
export function ExperimentCard({ p = 1, className = '', style }: MockProps) {
  const row = PATTERN.rows[0]
  const band = ease(seg(p, 0.4, 0.75))
  const g = (i: number) => ease(seg(p, 0.6 + i * 0.12, 0.85 + i * 0.12))
  return (
    <div className={`f-card f-pad mk-exp ${className}`} style={style} aria-hidden="true">
      <div className="f-row" style={rise(ease(seg(p, 0, 0.18)), 6)}>
        <div>
          <div className="f-label">Experiment · Not run</div>
          <div className="mk-title">{FOCUS.text}</div>
        </div>
        <span style={{ display: 'flex', gap: 6 }}>
          <span className="status-tag" data-status="concept">Concept</span>
          <Illustrative />
        </span>
      </div>
      <div className="mk-hyp" style={rise(ease(seg(p, 0.12, 0.35)), 8)}>
        <span className="f-label">Hypothesis</span>
        <p>After an objection, pausing before responding is associated with more next steps booked.</p>
      </div>
      <div className="mk-sim">
        <div className="f-label">Simulate · {row.label.toLowerCase()} · observed across {PATTERN.withN + PATTERN.withoutN} calls</div>
        <div className="mk-track">
          <span className="mk-pin" style={{ left: `${row.with}%` }}><b>{row.with}%</b><small>interrupted today</small></span>
          <span className="mk-pin mk-pin-r" style={{ left: `${row.without}%` }}><b>{row.without}%</b><small>let them finish</small></span>
          <span className="mk-band" style={{ left: `${row.with}%`, width: `${(row.without - row.with) * band}%` }} />
        </div>
        <div className="mk-range f-mono" style={{ opacity: band }}>Estimated range for a coached group falls between the two. Association, not proof.</div>
      </div>
      <div className="mk-groups">
        {[
          { h: 'Coached group', t: `Focus: ${FOCUS.text.toLowerCase()}` },
          { h: 'Comparison group', t: 'No focus. Same segment and stage.' },
          { h: 'Readout', t: 'Measured like behavior change results, confidence stated.' },
        ].map((x, i) => (
          <div key={x.h} className="mk-group" style={rise(g(i), 10)}>
            <b>{x.h}</b><span>{x.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
