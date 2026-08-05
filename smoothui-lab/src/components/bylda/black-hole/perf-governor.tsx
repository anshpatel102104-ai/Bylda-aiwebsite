import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Steps quality down when frames are actually slow.
 *
 * Feature detection cannot predict this scene's cost. It is bound almost purely
 * by fragment throughput — every pixel integrates an ODE — and nothing exposed
 * to JavaScript reports that. Core count, device memory and pointer type all
 * correlate weakly at best, so the starting tier is a guess and this is what
 * makes the guess safe to be wrong.
 *
 * Measuring rather than predicting also covers the cases detection cannot see at
 * all: a laptop that switched to its integrated GPU on battery, a heavily
 * loaded machine, a very large display.
 */
export default function PerfGovernor({
  tier,
  lastTier,
  onDemote,
}: {
  tier: number
  lastTier: number
  onDemote: () => void
}) {
  const s = useRef({ warm: 0, n: 0, sum: 0 })

  useFrame((_, delta) => {
    if (tier >= lastTier) return
    const a = s.current

    // Skip the opening frames outright. The first few include shader
    // compilation and buffer allocation and can take hundreds of milliseconds
    // on their own — judging on those would demote every device on the market.
    if (a.warm < 25) {
      a.warm++
      return
    }

    // A single long frame means nothing; a scheduler hiccup or a background tab
    // waking up produces those on hardware that is otherwise fine.
    if (delta > 0.5) return

    a.sum += delta
    a.n++

    // Decide on whichever comes first: enough frames for a stable read, or
    // enough wall-clock that waiting for them is itself the problem. A device
    // rendering at 2fps would need most of a minute to reach a 45-frame
    // verdict, and would spend all of it stuttering at a tier it cannot run.
    if (a.n < 45 && !(a.sum > 1.5 && a.n >= 8)) return

    const avg = a.sum / a.n
    a.sum = 0
    a.n = 0
    // Sustained below ~30fps. The threshold is deliberately well under 60: this
    // is a background, and dropping detail on a device that is merely at 45fps
    // would cost more than it buys.
    if (avg > 1 / 30) {
      a.warm = 0 // let the new tier settle before measuring it
      onDemote()
    }
  })

  return null
}
