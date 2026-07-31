import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'

/**
 * Reveal — scroll-in wrapper, the sandbox equivalent of the `.reveal` class
 * driven by bylda-redesign.js on the live site.
 *
 * `from` picks the entrance so sections don't all animate identically:
 *   up     rise + blur      (default; headings, copy)
 *   left   slide from left  (alternating card grids)
 *   right  slide from right
 *   scale  zoom up          (panels, stat columns)
 *   tilt   3D rotate in     (cards with perspective)
 *   flip   hinge from top   (table rows, list items)
 *
 * Fires once and respects prefers-reduced-motion.
 */

export type RevealFrom = 'up' | 'left' | 'right' | 'scale' | 'tilt' | 'flip'

const HIDDEN: Record<RevealFrom, string> = {
  up: 'translateY(22px)',
  left: 'translateX(-46px)',
  right: 'translateX(46px)',
  scale: 'scale(0.90)',
  tilt: 'perspective(1000px) rotateY(-11deg) translateX(28px) scale(0.96)',
  flip: 'perspective(800px) rotateX(-14deg) translateY(14px)',
}

export default function Reveal({
  children,
  delay = 0,
  from = 'up',
  blur = true,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  from?: RevealFrom
  blur?: boolean
  className?: string
  as?: 'div' | 'section' | 'article' | 'li' | 'tr'
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const ease = 'cubic-bezier(.22,1,.36,1)'
  const dur = from === 'tilt' || from === 'flip' ? 900 : 760

  return (
    <Tag
      ref={ref as Ref<never>}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : HIDDEN[from],
        filter: shown || !blur ? 'none' : 'blur(6px)',
        transformOrigin: from === 'flip' ? 'center top' : 'center',
        transition: `opacity ${dur}ms ${ease} ${delay}ms, transform ${dur}ms ${ease} ${delay}ms, filter ${dur}ms ${ease} ${delay}ms`,
        willChange: shown ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </Tag>
  )
}
