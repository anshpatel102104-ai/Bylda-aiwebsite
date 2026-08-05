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

export default function BlackHoleCanvas({
  active,
  offsetX = 0,
  offsetY = 0,
}: {
  active: boolean
  offsetX?: number
  offsetY?: number
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
  const still = reduced || !active

  return (
    <Canvas
      dpr={quality.dpr}
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
      />
    </Canvas>
  )
}
