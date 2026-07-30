import { useEffect, useRef } from 'react'

/**
 * HeroFlow — the animated backdrop behind the hero headline.
 *
 * Two layers, both on one canvas:
 *  1. Aurora ribbons — slow sine bands in the Bylda sky palette, drawn at
 *     quarter resolution on an offscreen canvas and blurred once, then scaled
 *     up. Blurring 1/4 of the pixels is what keeps this cheap.
 *  2. A particle stream — motes drift left→right along a flow field and
 *     converge toward a focus point, brightening as they arrive. It's the
 *     headline made literal: scattered ideas becoming customers.
 *
 * Honours prefers-reduced-motion by painting a single static frame.
 */

const SKY = [
  [56, 189, 248], // #38BDF8 sky-400
  [14, 165, 233], // #0EA5E9 sky-500
  [2, 132, 199], // #0284C7 sky-600
  [125, 211, 252], // #7DD3FC sky-300
] as const

type Mote = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  life: number
  max: number
  c: number
}

const RIBBONS = 3
const MOTES = 90
const DOWNSCALE = 4

export default function HeroFlow({
  className = '',
  ribbons = true,
}: {
  className?: string
  /** Off when a richer background (HeroAurora) already supplies the light. */
  ribbons?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Offscreen buffer for the blurred ribbon layer.
    const rib = document.createElement('canvas')
    const rctx = rib.getContext('2d')
    if (!rctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let motes: Mote[] = []

    const seedMotes = () => {
      motes = Array.from({ length: MOTES }, () => spawn(true))
    }

    function spawn(initial = false): Mote {
      const max = 260 + Math.random() * 320
      return {
        x: initial ? Math.random() * w : -20 - Math.random() * 120,
        y: Math.random() * h,
        vx: 0.35 + Math.random() * 0.75,
        vy: 0,
        r: 0.7 + Math.random() * 1.9,
        a: 0.25 + Math.random() * 0.55,
        life: initial ? Math.random() * max : 0,
        max,
        c: Math.floor(Math.random() * SKY.length),
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      rib.width = Math.max(1, Math.round(w / DOWNSCALE))
      rib.height = Math.max(1, Math.round(h / DOWNSCALE))
      seedMotes()
    }

    // Focus point the motes converge on — sits under the headline.
    const focus = () => ({ x: w * 0.5, y: h * 0.3 })

    const drawRibbons = (t: number) => {
      const rw = rib.width
      const rh = rib.height
      rctx.clearRect(0, 0, rw, rh)
      rctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < RIBBONS; i++) {
        const [r, g, b] = SKY[i % SKY.length]
        const phase = t * (0.00007 + i * 0.000024) + i * 1.9
        // Keep the bands in the upper band of the hero, behind the headline,
        // rather than spreading down over the CTAs and product card.
        const amp = rh * (0.055 + i * 0.02)
        const mid = rh * (0.17 + i * 0.09)

        const grad = rctx.createLinearGradient(0, 0, rw, 0)
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`)
        grad.addColorStop(0.35, `rgba(${r},${g},${b},0.20)`)
        grad.addColorStop(0.65, `rgba(${r},${g},${b},0.16)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        rctx.beginPath()
        for (let x = 0; x <= rw; x += 3) {
          const p = x / rw
          // Low frequency keeps this a soft wash; higher harmonics turned the
          // bands into visible chevrons once blurred.
          const y =
            mid +
            Math.sin(p * 1.5 + phase) * amp +
            Math.sin(p * 2.6 - phase * 1.4) * amp * 0.3
          if (x === 0) rctx.moveTo(x, y)
          else rctx.lineTo(x, y)
        }
        rctx.strokeStyle = grad
        rctx.lineWidth = rh * (0.045 + i * 0.012)
        rctx.lineCap = 'round'
        rctx.stroke()
      }

      rctx.globalCompositeOperation = 'source-over'

      // One blur pass over the small buffer, then upscale.
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.filter = `blur(${Math.max(44, w * 0.075)}px)`
      ctx.globalAlpha = 0.62
      ctx.drawImage(rib, 0, 0, w, h)
      ctx.restore()
    }

    const drawMotes = (dt: number) => {
      const f = focus()
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        m.life += dt

        if (!reduced) {
          // Flow field: drift right, with a gentle pull toward the focus so the
          // stream visibly converges instead of running straight across.
          const dx = f.x - m.x
          const dy = f.y - m.y
          const d = Math.hypot(dx, dy) || 1
          const pull = Math.min(0.02, 220 / (d * d))
          m.vy += (dy / d) * pull * dt
          m.vy += Math.sin(m.x * 0.004 + m.life * 0.002) * 0.0016 * dt
          m.vy *= 0.985
          m.x += m.vx * dt * 0.06
          m.y += m.vy * dt * 0.06
        }

        const k = m.life / m.max
        if (k >= 1 || m.x > w + 40) {
          motes[i] = spawn()
          continue
        }

        // Fade in, hold, fade out.
        const env = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1
        const [r, g, b] = SKY[m.c]
        const prox = 1 - Math.min(1, Math.hypot(f.x - m.x, f.y - m.y) / (w * 0.5))
        const alpha = m.a * env * (0.45 + prox * 0.75)

        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r * (1 + prox * 0.8), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()

        // Halo on the ones nearing the focus.
        if (prox > 0.55) {
          ctx.beginPath()
          ctx.arc(m.x, m.y, m.r * 5 * prox, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.12})`
          ctx.fill()
        }
      }
      ctx.restore()
    }

    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      ctx.clearRect(0, 0, w, h)
      if (ribbons) drawRibbons(now)
      drawMotes(dt)
      if (!reduced) raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [ribbons])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 78%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 78%)',
      }}
    />
  )
}
