export type Quality = {
  /** Geodesic integration steps per ray. */
  steps: number
  /** Angular step size, radians of orbital angle per iteration. */
  dphi: number
  particles: number
  sparkles: number
  bloom: number
  dpr: [number, number]
}

/**
 * Three tiers, picked once at mount.
 *
 * The cost of this scene is almost entirely `steps × pixels`: every pixel walks
 * an ODE, and unlike a mesh scene there is nothing to cull, batch or occlude.
 * So the tiers trade the two factors against each other rather than turning
 * features off — dropping steps costs accuracy in the photon ring, dropping DPR
 * costs edge sharpness, and on a phone both are less visible than a bad frame
 * rate.
 *
 * dphi is raised as steps fall so that the total angle a ray can sweep stays
 * roughly constant at ~9.5 radians. Cutting steps alone would shorten the arc
 * instead of coarsening it, and rays that wind past the photon sphere would run
 * out of budget mid-orbit — which shows up as the Einstein ring going blotchy
 * rather than merely soft.
 *
 * The top tier is deliberately expensive — 480 steps at dφ = 0.020 resolves the
 * photon ring sharply and lets rays wind the sphere more than once — because
 * the frame-time governor will walk it back down on hardware that cannot hold
 * it. Guessing conservatively would cap good GPUs for the benefit of bad ones.
 */
const HIGH: Quality = { steps: 480, dphi: 0.020, particles: 2400, sparkles: 80, bloom: 0.62, dpr: [1, 2] }
const MEDIUM: Quality = { steps: 360, dphi: 0.026, particles: 1500, sparkles: 48, bloom: 0.58, dpr: [1, 1.6] }
const LOW: Quality = { steps: 250, dphi: 0.036, particles: 900, sparkles: 0, bloom: 0.5, dpr: [1, 1] }

/** Ordered best to worst. The runtime governor walks down this list. */
export const TIERS: Quality[] = [HIGH, MEDIUM, LOW]

/**
 * Opening guess only.
 *
 * None of these signals actually measure fragment throughput, which is the only
 * thing that matters for a per-pixel raymarcher — a phone with eight cores and
 * plenty of RAM can still have a GPU that chokes on this, and an old laptop with
 * a good discrete card sails through. So this just picks a sane starting tier
 * and the frame-time governor corrects it from there.
 */
export function detectTier(): number {
  if (typeof window === 'undefined') return 1

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900
  // navigator.deviceMemory is Chromium-only; absence is not evidence of a weak
  // device, so it only ever demotes when it is present and low.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency ?? 4

  if ((coarse && narrow) || (mem !== undefined && mem <= 4) || cores <= 4) return 2
  if (coarse || narrow || (mem !== undefined && mem <= 8)) return 1
  return 0
}

export { HIGH, MEDIUM, LOW }
