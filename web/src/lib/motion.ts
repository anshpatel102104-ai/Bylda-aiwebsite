/** Pure timing helpers. Everything here is a function of its inputs: no clocks, no state. */

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/** Linear progress of t through [a, b], clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))

/** cubic-bezier(x1, y1, x2, y2) as a function of linear progress. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u
  const sy = (u: number) => ((ay * u + by) * u + cy) * u
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let u = x
    for (let i = 0; i < 6; i++) {
      const e = sx(u) - x
      const d = dx(u)
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break
      u -= e / d
    }
    return sy(clamp(u))
  }
}

/** The site easing: cubic-bezier(.22, 1, .36, 1). */
export const ease = bezier(0.22, 1, 0.36, 1)
/** Ease-in for camera pushes: slow start, fast arrival into the target. */
export const easeIn = bezier(0.55, 0, 0.9, 0.4)
export const easeInOut = bezier(0.65, 0, 0.35, 1)

/** Eased progress of t through [a, b]. */
export const eseg = (t: number, a: number, b: number) => ease(seg(t, a, b))

/** Characters of text visible at progress p. */
export const typed = (text: string, p: number) => text.slice(0, Math.round(text.length * clamp(p)))

/** Count a number up to its target at progress p, keeping its decimals. */
export const countTo = (target: number, p: number, decimals = 0, from = 0) =>
  lerp(from, target, ease(clamp(p))).toFixed(decimals)

/** A fade plus upward drift, as a style object. */
export const rise = (p: number, px = 12) => ({
  opacity: p,
  transform: `translate3d(0, ${(1 - p) * px}px, 0)`,
})
