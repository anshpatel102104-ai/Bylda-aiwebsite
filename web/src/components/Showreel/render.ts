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
  desktop: { marker: { x: 590, y: 300 }, toast: { x: 870, y: 60 }, gotit: { x: 240, y: 520 }, phantom: { x: 545, y: 300 } },
  mobile: { marker: { x: 270, y: 330 }, toast: { x: 260, y: 312 }, gotit: { x: 150, y: 560 }, phantom: { x: 255, y: 310 } },
}

/**
 * The on-screen cursor: who acts in each chapter, and what they touch. A click
 * is the cause of the next handoff; a hover opens the compact popover the app
 * uses instead of a new page. Cues missing in a variant are skipped.
 */
interface Beat { cue: string | Record<Variant, string>; show: number; move: [number, number]; click?: number; hide: number; tip?: string | Record<Variant, string> }
const BEATS: ReadonlyArray<Beat> = [
  // Event: the manager opens the moment.
  { cue: 'marker', show: 3.05, move: [3.25, 4.1], click: 4.3, hide: 4.65 },
  // Behavior: hover the leak on this call.
  { cue: { desktop: 'interruptions', mobile: 'evidence' }, show: 9.6, move: [9.75, 10.3], hide: 11.85,
    tip: { desktop: '3 of 5 overlaps came during pricing', mobile: 'Play the 18:42 moment' } },
  // Pattern: the same leak across 30 days.
  { cue: 'leak', show: 14.8, move: [14.95, 15.5], hide: 17.35, tip: '1.5 per objection vs team 0.6, rising for 8 weeks' },
  // Outcome: the manager assigns coaching; the toast carries the film to the rep.
  { cue: { desktop: 'assign', mobile: 'coachrow' }, show: 21.2, move: [21.35, 21.9], click: 22.05, hide: 22.6 },
  // Change: the rep accepts the focus.
  { cue: 'gotit', show: 28.4, move: [28.55, 29.0], click: 29.12, hide: 29.45 },
  // Measure: inspect what the result does and does not prove.
  { cue: 'note', show: 34.9, move: [35.0, 35.5], hide: 36.0, tip: 'n = 21 calls. Bylda can\u2019t rule out other factors.' },
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
const PUSH_SCALE = { marker: 21, toast: 20, gotit: 19, phantom: 15 }
/**
 * Each push ends with the frame filled by the target's navy. On pearl a
 * crossfade out of navy reads as a grey wash, so the next chapter opens
 * through an iris instead: the moment a push fills the frame, a navy
 * overlay takes over and a soft-edged hole grows from the centre.
 */
const CUTS = [6.0, 24.5, 30.5]
const IRIS = 0.6
export const IRIS_FEATHER = 36

export interface Layer { show: boolean; opacity: number; transform: string }
export interface Bg { i: number; opacity: number; scale: number }

export interface Frame {
  t: number
  chapter: number
  /** 0..1 progress within each chapter, for the progress line. */
  parts: number[]
  bg: Bg[]
  layers: Layer[]
  /** Iris after a push: the frame is solid navy with a hole of radius r (canvas px) opening on the next chapter. */
  cut: { r: number } | null
  /** The frame is mostly navy (end of a push, start of its iris): stage chrome flips to its light tone. */
  navy: boolean
  hud: Hud
  p: {
    timeline: { lanes: number; events: number; metrics: number; marker: number; quiet: number }
    analysis: { type: number }
    behaviors: { rows: number; highlight: number }
    hoverRow: number
    toast: number
    /** 0..1 toast contents fade so the push lands in solid ink. */
    toastQuiet: number
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

  /* ---- Layers: Event, Behavior, Pattern, Outcome, Change, Measure ---- */
  const L: Layer[] = CHAPTERS.map(() => ({ show: false, opacity: 0, transform: tf(0, 0) }))
  const slideIn = (a: number, b: number) => tf(W * (1 - easeInOut(S(a, b))), 0)
  const slideOut = (a: number, b: number) => tf(-W * easeInOut(S(a, b)), 0)

  // Event: emerges from darkness, the camera pushes into the 18:42 marker.
  if (t < 6.05) {
    const emerge = E(0, 0.9)
    L[0] = {
      show: true,
      opacity: t < 6.0 ? emerge : 0,
      transform: t < 4.7 ? tf(0, (1 - emerge) * 18) : push(t, 4.7, 6.0, cams.marker, PUSH_SCALE.marker, F),
    }
  }
  // Behavior: lands out of the marker, slides on to the pattern.
  if (t >= 5.85 && t < 12.55) {
    L[1] = { show: true, opacity: t >= 6.0 ? 1 : 0, transform: t < 11.9 ? land(t, 5.85, 0.8, F) : slideOut(11.9, 12.5) }
  }
  // Pattern: the rep's profile slides in, then on to the team outcome.
  if (t >= 11.9 && t < 18.05) {
    L[2] = { show: true, opacity: 1, transform: t < 12.5 ? slideIn(11.9, 12.5) : slideOut(17.4, 18.0) }
  }
  // Outcome: the team pattern and the manager's coach queue; the push goes into the toast.
  if (t >= 17.4 && t < 24.55) {
    L[3] = {
      show: true,
      opacity: t < 24.5 ? 1 : 0,
      transform: t < 18 ? slideIn(17.4, 18.0) : t < 23.2 ? tf(0, 0) : push(t, 23.2, 24.5, cams.toast, PUSH_SCALE.toast, F),
    }
  }
  // Change: the rep's morning lands out of the toast; the push goes into "Got it".
  if (t >= 24.35 && t < 30.55) {
    L[4] = {
      show: true,
      opacity: t >= 24.5 && t < 30.5 ? 1 : 0,
      transform: t < 29.3 ? land(t, 24.35, 0.8, F) : push(t, 29.3, 30.5, cams.gotit, PUSH_SCALE.gotit, F),
    }
  }
  // Measure: the result lands, pulls back to the official mark, then dissolves to the start
  // (pearl to pearl). The dark film pushed into the Phantom here; on pearl that cut flashes black.
  if (t >= 30.35) {
    L[5] = { show: true, opacity: t >= 30.5 ? 1 - S(37.55, 38.0) : 0, transform: land(t, 30.35, 0.8, F) }
  }

  /* ---- Backgrounds: one dark atmosphere, ribbons crossfade at each handoff ---- */
  const into = [[37.55, 38.0], [5.85, 6.0], [11.9, 12.5], [17.4, 18.0], [24.35, 24.5], [30.35, 30.5]]
  const bgOpacity = CHAPTERS.map((_, i) => {
    const next = into[(i + 1) % CHAPTERS.length]
    if (i === 0) return t < 6.1 ? 1 - S(next[0], next[1]) : S(into[0][0], into[0][1])
    return S(into[i][0], into[i][1]) * (i === CHAPTERS.length - 1 ? 1 - S(into[0][0], into[0][1]) : 1 - S(next[0], next[1]))
  })
  const bg: Bg[] = bgOpacity
    .map((o, i) => ({ i, opacity: clamp(o), scale: lerp(1.14, 1.02, ease(seg(t, CHAPTERS[i].start - 0.6, CHAPTERS[i].end))) }))
    .filter(b => b.opacity > 0.001)

  /* ---- Iris out of each push ---- */
  const c = CUTS.find(at => t >= at && t < at + IRIS)
  const cut = c === undefined ? null : { r: lerp(0, Math.hypot(W, H) / 2 + IRIS_FEATHER, easeInOut(seg(t, c, c + IRIS))) }

  /* ---- Progress line ---- */
  const parts = CHAPTERS.map(c => clamp((t - c.start) / (c.end - c.start)))

  return {
    t,
    chapter: chapterAt(t),
    parts,
    bg,
    layers: L,
    cut,
    navy: CUTS.some(at => t >= at - 0.2 && t < at + IRIS * 0.5),
    hud: hud(t, v, cams, W, H),
    p: {
      timeline: { lanes: S(0.5, 2.6), events: S(1.6, 3.2), metrics: S(2.2, 3.6), marker: S(3.2, 4.5), quiet: S(4.7, 5.1) },
      analysis: { type: S(6.4, 9.6) },
      behaviors: { rows: S(9.2, 10.1), highlight: S(10.3, 10.6) },
      hoverRow: S(15.5, 15.65) * (1 - S(17.2, 17.35)),
      profile: { cascade: S(12.6, 13.3), count: S(12.8, 14.0), draw: S(13.2, 15.0), tags: S(14.3, 15.2) },
      pattern: { head: S(18.1, 18.6), fill: S(18.4, 19.8), note: S(19.7, 20.2) },
      manager: { insight: S(19.9, 20.5), rows: S(20.3, 21.0) },
      toast: E(22.15, 22.45),
      toastQuiet: S(23.2, 23.55),
      brief: { crisp: 1 - S(25.0, 25.6), blur: S(25.0, 25.6), glass: E(25.0, 25.7) },
      focus: { rise: E(25.4, 26.0), type: S(25.9, 27.2), cols: S(27.1, 28.0), draw: S(27.8, 28.6), press: S(29.05, 29.55), quiet: S(29.3, 29.7) },
      result: { head: S(30.5, 31.2), before: S(30.9, 31.9), focus: S(31.9, 32.4), after: S(32.3, 33.5), medians: S(33.1, 34.1), rows: S(33.7, 34.9), note: S(34.8, 35.3) },
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
