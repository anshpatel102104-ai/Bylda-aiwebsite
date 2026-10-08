import type { CSSProperties } from 'react'

const BASE = import.meta.env.BASE_URL

/**
 * Wordmark fills. The chrome sweep is sampled from the official artwork and is
 * for dark surfaces; on light surfaces the same sweep is deepened to gunmetal so
 * the letters keep their contrast. Defined in tokens.css.
 */
const FILLS = {
  dark: 'var(--wordmark-gunmetal)',
  light: 'var(--wordmark-chrome)',
} as const

/** Official wordmark artwork, width / height. */
const WORDMARK_RATIO = 1108 / 251

/**
 * BYLDA, the official wordmark: traced from the logo artwork to /brand/bylda-wordmark.svg
 * and used as a mask over the chrome fill, so the custom letterforms (B and D spurs,
 * the long A crossbar) stay exact at every size.
 */
export function Wordmark({ tone = 'dark', height = 20, title = 'Bylda', className = '', style }: {
  tone?: keyof typeof FILLS; height?: number; title?: string | null; className?: string; style?: CSSProperties
}) {
  return (
    <span
      className={`wordmark ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      style={{
        // height is the cap height, as with the official artwork
        width: Math.round(height * WORDMARK_RATIO),
        height,
        background: FILLS[tone],
        ...style,
      }}
    />
  )
}

/** The official mark: chrome hex ribbon around the Phantom. Raster until a vector source exists. */
export function Mark({ size = 28, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={size > 64 ? `${BASE}brand/bylda-mark-375.webp` : `${BASE}brand/bylda-mark-128.webp`}
      alt="" width={Math.round(size * 333 / 375)} height={size}
      className={className} style={style} decoding="async"
    />
  )
}

/** Mark plus wordmark, for nav and footer. The mark is drawn large with a soft shadow so the chrome reads on light surfaces. */
export function Logo({ tone = 'dark', height = 22, className = '' }: { tone?: keyof typeof FILLS; height?: number; className?: string }) {
  return (
    <span className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.6) }}>
      <Mark size={Math.round(height * 2.6)} style={{ filter: tone === 'dark' ? 'drop-shadow(0 1px 2px rgba(11, 11, 12, .35)) contrast(1.12)' : undefined }} />
      <Wordmark tone={tone} height={height} />
    </span>
  )
}
