import { useId, type ReactNode } from 'react'
import type { Tone } from '../data/sample'
import { clamp } from '../lib/motion'

export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className="f-tag" data-tone={tone}>{children}</span>
}

/** The app's confidence meter: three bars plus a mono label. */
export function Confidence({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const on = level === 'High' ? 3 : level === 'Medium' ? 2 : 1
  return (
    <span className="f-conf f-label">
      <span style={{ display: 'inline-flex', gap: 2 }}>
        {[0, 1, 2].map(i => <i key={i} className={i < on ? '' : 'off'} />)}
      </span>
      Confidence {level}
    </span>
  )
}

/** Small line chart with a reveal (clip grows left to right via transform). */
export function Spark({ values, color, draw = 1, w = 80, h = 18 }: {
  values: ReadonlyArray<number>; color: string; draw?: number; w?: number; h?: number
}) {
  const id = useId().replace(/:/g, '')
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - v * h).toFixed(1)}`).join(' ')
  return (
    <svg className="bp-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="-2" y="-4" width={w + 4} height={h + 8} style={{ transform: `scaleX(${clamp(draw)})`, transformOrigin: '0 0' }} />
        </clipPath>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${id})`} />
    </svg>
  )
}
