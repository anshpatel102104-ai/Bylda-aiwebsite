import type { CSSProperties } from 'react'
import { BRIEF } from '../data/sample'

/** Rebuild of the top of Rep Home, Daily Brief (Figma, Prototypes F 4078:65898). Used as the rep's morning behind the focus card. */
export function RepBrief({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`rh ${className}`} style={style} aria-hidden="true">
      <div className="f-label">{BRIEF.date}</div>
      <div className="rh-greet">{BRIEF.greeting}</div>
      <div className="rh-sum">{BRIEF.summary}</div>
    </div>
  )
}
