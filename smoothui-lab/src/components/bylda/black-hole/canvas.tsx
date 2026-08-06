import { useCallback, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import Scene from './scene'
import { TIERS, detectTier } from './quality'

/**
 * In "demand" mode R3F only draws when something asks it to. A still frame is
 * one draw, but it has to happen *after* the composer has been sized, so ask
 * again once on mount.
 */
function Kick() {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  useEffect(() => {
    invalidate()
    const id = requestAnimationFrame(() => invalidate())
    return () => cancelAnimationFrame(id)
  }, [invalidate, size.width, size.height])
  return null
}

/**
 * Highest device-pixel count worth rendering: 4K plus a little headroom.
 *
 * The cap exists because this shader's cost is linear in pixels with a very
 * large constant — every one of them integrates an ODE — so an uncapped DPR on
 * a 5K display would quadruple the work for detail past what the panel can
 * resolve at viewing distance.
 */
const MAX_PIXELS = 8_900_000

export default function BlackHoleCanvas({
  active,
  offsetX = 0,
  offsetY = 0,
  ghost = 0.6,
  respectReducedMotion = true,
}: {
  active: boolean
  offsetX?: number
  offsetY?: number
  /** Brightness of the lensed brand mark in the sky. 0 disables it. */
  ghost?: number
  /** Set false to keep animating even when the OS asks for reduced motion. */
  respectReducedMotion?: boolean
}) {
  const [tier, setTier] = useState(detectTier)
  const quality = TIERS[tier]
  const demote = useCallback(() => setTier((t) => Math.min(t + 1, TIERS.length - 1)), [])
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Reduced motion gets one static frame, not a slower orbit: the objection to
  // a moving background is the movement, not its speed. Scrolling the hero out
  // of view stops the loop for the same reason it stops a video — there is
  // nothing to see and a raymarcher is not cheap to keep running.
  const still = (reduced && respectReducedMotion) || !active

  // Resolve the tier's DPR ceiling against the 4K budget, so a large window
  // scales down rather than blowing straight past it.
  const [vw, vh] = typeof window === 'undefined' ? [1920, 1080] : [window.innerWidth, window.innerHeight]
  const dprCap = Math.min(quality.dpr[1], Math.sqrt(MAX_PIXELS / Math.max(vw * vh, 1)))

  return (
    <Canvas
      dpr={[quality.dpr[0], Math.max(dprCap, quality.dpr[0])]}
      frameloop={still ? 'demand' : 'always'}
      gl={{
        antialias: false,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
        // The composer owns the buffer between frames; preserving it costs
        // bandwidth for something nothing reads back.
        preserveDrawingBuffer: false,
      }}
      camera={{ fov: 42, near: 0.1, far: 4000, position: [24, 3.8, 0] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Kick />
      <Scene
        quality={quality}
        paused={still}
        offsetX={offsetX}
        offsetY={offsetY}
        tier={tier}
        lastTier={TIERS.length - 1}
        onDemote={demote}
        ghost={ghost}
      />
    </Canvas>
  )
}
