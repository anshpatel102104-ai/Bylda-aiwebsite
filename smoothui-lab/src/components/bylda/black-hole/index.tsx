import { Suspense, lazy, useEffect, useRef, useState } from 'react'

// three + fiber + drei is by far the largest thing on the homepage. Splitting it
// here keeps it out of the entry chunk, so the headline paints on the HTML and
// the CSS fallback while the renderer streams in behind it.
const BlackHoleCanvas = lazy(() => import('./canvas'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Cinematic black hole for the hero.
 *
 * Renders a raytraced Schwarzschild black hole — gravitationally lensed
 * accretion disk, Doppler-beamed and gravitationally redshifted, orbiting
 * debris, and a lensed procedural star field — behind the hero copy.
 *
 * The static gradient underneath is not a loading spinner; it stays in the DOM
 * permanently and is what gets seen on a machine with no WebGL, before the
 * chunk arrives, and behind the canvas the whole time. It is tuned to the same
 * palette so the handover is not visible.
 */
export default function BlackHoleHero({
  className = '',
  offsetX = 0,
  offsetY = 0,
  ghost,
  respectReducedMotion,
}: {
  className?: string
  /** Push the hole off-centre so headline copy can sit clear of it. */
  offsetX?: number
  offsetY?: number
  /** Brightness of the lensed brand mark in the sky. 0 disables it. */
  ghost?: number
  respectReducedMotion?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mount, setMount] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!hasWebGL()) return
    const el = ref.current
    if (!el) return

    // Mount on first approach rather than on first pixel, so the chunk and the
    // shader compile are already done by the time it is actually looked at.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMount(true)
        setActive(e.isIntersecting)
      },
      { rootMargin: '200px' }
    )
    io.observe(el)

    const onVis = () => setActive(!document.hidden && !!ref.current?.isConnected)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    // Inline styles rather than utility classes: this component is mounted both
    // inside the Tailwind app and as a standalone island on the hand-written
    // static site, and the island has no Tailwind to resolve them against.
    <div
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#000',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 85% at 50% 52%, rgba(226,226,226,0.13) 0%, rgba(120,120,120,0.06) 22%, rgba(9,9,11,0.92) 55%, #050506 100%)',
        }}
      />
      {mount && (
        <Suspense fallback={null}>
          <BlackHoleCanvas
            active={active}
            offsetX={offsetX}
            offsetY={offsetY}
            ghost={ghost}
            respectReducedMotion={respectReducedMotion}
          />
        </Suspense>
      )}
    </div>
  )
}
