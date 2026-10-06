/**
 * The showreel's single source of motion.
 *
 * render(t) is pure: given a time, a canvas variant and the camera targets it
 * returns the full frame (backgrounds, layer transforms, and the progress
 * values every rebuilt fragment draws from). Play, pause, scrub, chapter jump,
 * loop and reduced-motion stills all call it. Nothing accumulates between calls.
 */
import { clamp, ease, easeInOut, lerp, seg } from '../../lib/motion'
import { CHAPTERS, DURATION, chapterAt } from './timeline'

export type Variant = 'desktop' | 'mobile'
export interface Pt { x: number; y: number }
/** Named points on the canvas, measured from [data-cue] elements: camera targets and cursor stops. */
export type Cams = Record<string, Pt>

export const CANVAS: Record<Variant, { w: number; h: number }> = {
  desktop: { w: 1100, h: 640 },
  mobile: { w: 520, h: 650 },
}

/** Fallback camera targets until the DOM has been measured. */
export const DEFAULT_CAMS: Record<Variant, Cams> = {
  desktop: { marker: { x: 590, y: 300 }, gotit: { x: 240, y: 520 }, phantom: { x: 545, y: 300 } },
  mobile: { marker: { x: 270, y: 330 }, gotit: { x: 150, y: 560 }, phantom: { x: 255, y: 310 } },
}

/**
 * The on-screen cursor: who acts in each chapter, and what they touch. A click
 * is the cause of the next handoff; a hover opens the compact popover the app
 * uses instead of a new page. Cues missing in a variant are skipped.
 */
interface Beat { cue: string | Record<Variant, string>; show: number; move: [number, number]; click?: number; hide: number; tip?: string | Record<Variant, string> }
const BEATS: ReadonlyArray<Beat> = [
  { cue: 'marker', show: 3.05, move: [3.25, 4.1], click: 4.3, hide: 4.65 },
  { cue: { desktop: 'interruptions', mobile: 'evidence' }, show: 9.8, move: [9.95, 10.6], hide: 12.15,
    tip: { desktop: '3 of 5 overlaps came during pricing', mobile: 'Play the 18:42 moment' } },
  { cue: 'leak', show: 15.3, move: [15.45, 16.1], hide: 17.95, tip: '1.5 per objection vs team 0.6, rising for 8 weeks' },
  { cue: 'gotit', show: 22.45, move: [22.6, 23.1], click: 23.22, hide: 23.75 },
  { cue: 'note', show: 29.6, move: [29.75, 30.35], hide: 31.25, tip: 'n = 21 calls. Bylda can\u2019t rule out other factors.' },
  { cue: { desktop: 'assign', mobile: 'coachrow' }, show: 34.45, move: [34.6, 35.05], click: 35.18, hide: 35.85 },
]

export interface Hud {
  cursor: { x: number; y: number; opacity: number; press: number }
  ring: { x: number; y: number; scale: number; opacity: number }
  tip: { x: number; y: number; opacity: number; text: string; align: 'start' | 'center' | 'end' }
}

function hud(t: number, v: Variant, cams: Cams, W: number, H: number): Hud {
  const pick = <T,>(x: T | Record<Variant, T>) => (typeof x === 'object' && x !== null && 'desktop' in (x as object) ? (x as Record<Variant, T>)[v] : x as T)
  const none: Hud = { cursor: { x: 0, y: 0, opacity: 0, press: 0 }, ring: { x: 0, y: 0, scale: 1, opacity: 0 }, tip: { x: 0, y: 0, opacity: 0, text: '', align: 'center' } }
  const b = BEATS.find(b => t >= b.show && t < b.hide)
  if (!b) return none
  const to = cams[pick(b.cue)]
  if (!to) return none
  // Enter from below right, along a slight arc, like a hand moving a mouse.
  const from = { x: Math.min(W - 24, to.x + 170), y: Math.min(H - 24, to.y + 120) }
  const k = easeInOut(seg(t, b.move[0], b.move[1]))
  const arc = Math.sin(Math.PI * k) * 26
  const x = lerp(from.x, to.x, k) + arc * 0.4
  const y = lerp(from.y, to.y, k) - arc
  const opacity = seg(t, b.show, b.show + 0.2) * (1 - seg(t, b.hide - 0.2, b.hide))
  const c = b.click
  const press = c !== undefined && t >= c - 0.06 && t < c + 0.12 ? 1 : 0
  const r = c !== undefined ? seg(t, c, c + 0.42) : 0
  const tipText = b.tip ? pick(b.tip) : ''
  const tipOn = tipText ? ease(seg(t, b.move[1] + 0.05, b.move[1] + 0.3)) * (1 - seg(t, b.hide - 0.25, b.hide)) : 0
  return {
    cursor: { x, y, opacity, press },
    ring: { x: to.x, y: to.y, scale: lerp(0.35, 1.8, ease(r)), opacity: r > 0 && r < 1 ? 0.5 * (1 - r) : 0 },
    // Popovers near an edge anchor to that side so they stay inside the frame.
    tip: { x: to.x, y: to.y, opacity: tipOn, text: tipText, align: to.x < W * 0.28 ? 'start' : to.x > W * 0.72 ? 'end' : 'center' },
  }
}

/** Zoom reached when a push fully fills the frame with the target's colour. */
const PUSH_SCALE = { marker: 21, gotit: 19, phantom: 15 }

export interface Layer { show: boolean; opacity: number; transform: string }
export interface Bg { i: number; opacity: number; scale: number }

export interface Frame {
  t: number
  chapter: number
  /** 0..1 progress within each chapter, for the progress line. */
  parts: number[]
  bg: Bg[]
  layers: Layer[]
  hud: Hud
  p: {
    timeline: { lanes: number; events: number; metrics: number; marker: number; quiet: number }
    analysis: { type: number }
    behaviors: { rows: number; highlight: number }
    hoverRow: number
    toast: number
    profile: { cascade: number; count: number; draw: number; tags: number }
    brief: { crisp: number; blur: number; glass: number }
    focus: { rise: number; type: number; cols: number; draw: number; press: number; quiet: number }
    result: { head: number; before: number; focus: number; after: number; medians: number; rows: number; note: number }
    pattern: { head: number; fill: number; note: number }
    manager: { insight: number; rows: number }
    end: { content: number; contentScale: number; phantom: number; phantomY: number; phantomScale: number }
  }
}

const tf = (dx: number, dy: number, s = 1) => `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`

/** Camera push: the target point travels to frame centre while zooming in (origin 0 0). */
function push(t: number, a: number, b: number, target: Pt, S: number, F: Pt) {
  // Zoom is exponential in eased progress, so it reads as a constant-speed
  // dolly. It reaches full scale 120ms early: the frame is filled by the
  // target's colour before the next chapter crossfades in.
  const k = easeInOut(seg(t, a, b - 0.12))
  const z = Math.pow(S, k)
  const c = ease(seg(t, a, b - 0.3))
  const px = lerp(target.x, F.x, c)
  const py = lerp(target.y, F.y, c)
  return tf(px - z * target.x, py - z * target.y, z)
}

/** Landing out of a push: scale 1.1 to 1 around frame centre. */
function land(t: number, a: number, dur: number, F: Pt) {
  const s = lerp(1.1, 1, ease(seg(t, a, a + dur)))
  return tf(F.x - s * F.x, F.y - s * F.y, s)
}

export function render(tIn: number, v: Variant, cams: Cams = DEFAULT_CAMS[v]): Frame {
  const t = ((tIn % DURATION) + DURATION) % DURATION
  const { w: W, h: H } = CANVAS[v]
  const F = { x: W / 2, y: H / 2 }
  const S = (a: number, b: number) => seg(t, a, b)
  const E = (a: number, b: number) => ease(seg(t, a, b))

  /* ---- Layers ---- */
  const L: Layer[] = CHAPTERS.map(() => ({ show: false, opacity: 0, transform: tf(0, 0) }))

  // 1 Observe: emerges from darkness, then the camera pushes into the 18:42 marker.
  if (t < 6.05) {
    const emerge = E(0, 0.9)
    L[0] = {
      show: true,
      opacity: emerge * (1 - S(5.85, 6.0)),
      transform: t < 4.7 ? tf(0, (1 - emerge) * 18) : push(t, 4.7, 6.0, cams.marker, PUSH_SCALE.marker, F),
    }
  }
  // 2 Understand: lands out of the marker, slides left at the end.
  if (t >= 5.85 && t < 13.05) {
    L[1] = {
      show: true,
      opacity: S(5.85, 6.0),
      transform: t < 12.4 ? land(t, 5.85, 0.8, F) : tf(-W * easeInOut(S(12.4, 13.0)), 0),
    }
  }
  // 3 Behavior profile: slides in from the right, slides up into the rep's morning.
  if (t >= 12.4 && t < 19.05) {
    L[2] = {
      show: true,
      opacity: 1,
      transform: t < 13 ? tf(W * (1 - easeInOut(S(12.4, 13.0))), 0) : tf(0, -H * easeInOut(S(18.2, 19.0))),
    }
  }
  // 4 Recommend: rises in from below, the camera pushes into "Got it".
  if (t >= 18.2 && t < 25.05) {
    L[3] = {
      show: true,
      opacity: 1 - S(24.85, 25.0),
      transform: t < 19 ? tf(0, H * (1 - easeInOut(S(18.2, 19.0)))) : t < 23.8 ? tf(0, 0) : push(t, 23.8, 25.0, cams.gotit, PUSH_SCALE.gotit, F),
    }
  }
  // 5 Change and measure: lands out of the button, slides left at the end.
  if (t >= 24.85 && t < 32.05) {
    L[4] = {
      show: true,
      opacity: S(24.85, 25.0),
      transform: t < 31.4 ? land(t, 24.85, 0.8, F) : tf(-W * easeInOut(S(31.4, 32.0)), 0),
    }
  }
  // 6 Pattern and manager: slides in, pulls back to the Phantom, pushes into it to loop.
  if (t >= 31.4) {
    L[5] = {
      show: true,
      opacity: 1,
      transform: t < 32 ? tf(W * (1 - easeInOut(S(31.4, 32.0))), 0) : t < 37.55 ? tf(0, 0) : push(t, 37.55, 38.0, cams.phantom, PUSH_SCALE.phantom, F),
    }
  }

  /* ---- Backgrounds: crossfade under slides and under filled pushes ---- */
  // Chapters 1 and 2 share one black background. At the loop point the frame
  // is filled by the Phantom's ink, so black returns underneath it.
  const bgOpacity = [
    t < 13 ? 1 - S(12.4, 13.0) : S(37.85, 38.0),
    0,
    S(12.4, 13.0) * (1 - S(18.2, 19.0)),
    S(18.2, 19.0) * (1 - S(24.7, 24.95)),
    S(24.7, 24.95) * (1 - S(31.4, 32.0)),
    S(31.4, 32.0) * (1 - S(37.85, 38.0)),
  ]
  const span = [[0, 13], [6, 13], [12.4, 19], [18.2, 25], [24.7, 32], [31.4, 38]]
  const bg: Bg[] = bgOpacity
    .map((o, i) => ({ i, opacity: clamp(o), scale: lerp(1.14, 1.02, ease(seg(t, span[i][0], span[i][1]))) }))
    .filter(b => b.opacity > 0.001)

  /* ---- Progress line ---- */
  const parts = CHAPTERS.map(c => clamp((t - c.start) / (c.end - c.start)))

  return {
    t,
    chapter: chapterAt(t),
    parts,
    bg,
    layers: L,
    hud: hud(t, v, cams, W, H),
    p: {
      timeline: { lanes: S(0.5, 2.6), events: S(1.6, 3.2), metrics: S(2.2, 3.6), marker: S(3.2, 4.5), quiet: S(4.7, 5.1) },
      analysis: { type: S(6.4, 9.9) },
      behaviors: { rows: S(9.5, 10.5), highlight: S(10.6, 10.9) },
      hoverRow: S(16.1, 16.25) * (1 - S(17.8, 17.95)),
      toast: E(35.25, 35.55),
      profile: { cascade: S(13.1, 13.9), count: S(13.3, 14.6), draw: S(13.8, 15.8), tags: S(15.0, 16.0) },
      brief: { crisp: 1 - S(19.5, 20.1), blur: S(19.5, 20.1), glass: E(19.5, 20.2) },
      focus: { rise: E(19.9, 20.5), type: S(20.4, 21.8), cols: S(21.7, 22.7), draw: S(22.4, 23.3), press: S(23.15, 23.7), quiet: S(23.8, 24.2) },
      result: { head: S(25.0, 25.7), before: S(25.4, 26.4), focus: S(26.4, 26.9), after: S(26.8, 28.0), medians: S(27.6, 28.6), rows: S(28.2, 29.4), note: S(29.3, 29.9) },
      pattern: { head: S(32.1, 32.7), fill: S(32.5, 33.9), note: S(33.8, 34.4) },
      manager: { insight: S(33.8, 34.4), rows: S(34.2, 34.9) },
      end: {
        content: 1 - S(36.1, 36.6),
        contentScale: lerp(1, 0.62, easeInOut(S(36.0, 36.7))),
        phantom: E(36.3, 37.1),
        phantomY: (1 - E(36.3, 37.1)) * 14,
        phantomScale: lerp(0.92, 1, E(36.3, 37.1)),
      },
    },
  }
}
