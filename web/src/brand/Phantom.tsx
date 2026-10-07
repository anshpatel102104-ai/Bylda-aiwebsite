import type { CSSProperties } from 'react'
import { PHANTOM_BODY, PHANTOM_EYES, PHANTOM_VIEWBOX } from './phantom-path'

/** The Phantom silhouette, traced from the official mark. */
export function Phantom({ body = 'var(--ink)', eyes = 'var(--pearl-0)', className = '', style, title }: {
  body?: string; eyes?: string; className?: string; style?: CSSProperties; title?: string
}) {
  return (
    <svg viewBox={PHANTOM_VIEWBOX} className={className} style={style} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={PHANTOM_BODY} fill={body} />
      {PHANTOM_EYES.map((e, i) => (
        <ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} transform={`rotate(${e.rot} ${e.cx} ${e.cy})`} fill={eyes} />
      ))}
    </svg>
  )
}
