import { useId, type CSSProperties } from 'react'

/**
 * Chrome ribbon arcs: vector bands filled with the chrome ramp, echoing the
 * ribbon in the official mark. Background only.
 */
const ARCS: Record<number, ReadonlyArray<string>> = {
  0: ['M-80 520 C 260 300, 620 640, 1180 260', 'M-80 580 C 300 380, 660 700, 1180 330'],
  1: ['M-60 120 C 300 360, 760 -40, 1180 220', 'M-60 170 C 320 420, 780 20, 1180 280'],
  2: ['M120 -40 C 260 260, 760 300, 980 700', 'M190 -40 C 330 240, 820 260, 1060 700'],
  3: ['M-80 380 C 240 120, 700 160, 1180 520'],
}

export function ChromeRibbon({ variant = 0, width = 44, opacity = 1, className = '', style }: {
  variant?: number; width?: number; opacity?: number; className?: string; style?: CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 1100 640" preserveAspectRatio="xMidYMid slice" className={className} style={{ opacity, ...style }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#f1f2f4" />
          <stop offset="0.22" stopColor="#a2a7b0" />
          <stop offset="0.4" stopColor="#f1f2f4" />
          <stop offset="0.58" stopColor="#7f858f" />
          <stop offset="0.76" stopColor="#d9dce1" />
          <stop offset="1" stopColor="#4a4e56" />
        </linearGradient>
      </defs>
      {(ARCS[variant % 4]).map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={i === 0 ? width : width * 0.45} strokeLinecap="round" opacity={i === 0 ? 1 : 0.7} />
      ))}
    </svg>
  )
}
