import type { CSSProperties } from 'react'

const BASE = import.meta.env.BASE_URL

/** Solid wordmark fills: near-black on light surfaces, near-white on dark. */
const FILLS = {
  dark: '#0b0b0c',
  light: '#f1f2f4',
} as const

/**
 * BYLDA set in Space Grotesk Medium (+18% tracking), solid fill. The font is self-hosted, so every visitor sees the
 * same letterforms.
 */
export function Wordmark({ tone = 'dark', height = 20, title = 'Bylda', className = '', style }: {
  tone?: keyof typeof FILLS; height?: number; title?: string | null; className?: string; style?: CSSProperties
}) {
  const fill = FILLS[tone]
  return (
    <span
      className={`wordmark ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      style={{
        // height is the cap height, as with the official artwork
        fontSize: Math.round(height / 0.7),
        color: fill,
        ...style,
      }}
    >
      BYLDA
    </span>
  )
}

/** The official mark: chrome hex ribbon around the Phantom. Raster until a vector source exists. */
export function Mark({ size = 28, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={size > 64 ? `${BASE}brand/bylda-mark-375.webp` : `${BASE}brand/bylda-mark-64.png`}
      alt="" width={Math.round(size * 333 / 375)} height={size}
      className={className} style={style} decoding="async"
    />
  )
}

/** Mark plus wordmark, for nav and footer. */
export function Logo({ tone = 'dark', height = 22, className = '' }: { tone?: keyof typeof FILLS; height?: number; className?: string }) {
  return (
    <span className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.45) }}>
      <Mark size={Math.round(height * 1.45)} />
      <Wordmark tone={tone} height={height} />
    </span>
  )
}
