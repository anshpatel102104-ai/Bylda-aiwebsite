import { useEffect, useRef, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { ROLES } from '../../data/site'
import { useReveal } from '../../lib/reveal'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { FocusCard } from '../../ui/FocusCard'
import { ManagerView } from '../../ui/ManagerView'
import { PatternCard } from '../../ui/PatternCard'

/** Two ways to use it. Same product, two levels of complexity: managers get the pattern, reps get relevance. */
type Spot = 'for-managers' | 'for-reps'
const SPOTS: ReadonlyArray<string> = ['for-managers', 'for-reps']

/**
 * The Solutions menu links to /#for-managers and /#for-reps. Landing on either
 * (a fresh load, a hash change, or clicking the same link again while already
 * here) pops that card out and dims the other for a few seconds.
 */
function useSpotlight() {
  const [spot, setSpot] = useState<Spot | null>(null)
  const timer = useRef(0)
  useEffect(() => {
    const show = (id: string) => {
      if (!SPOTS.includes(id)) return
      window.clearTimeout(timer.current)
      setSpot(id as Spot)
      timer.current = window.setTimeout(() => setSpot(null), 3200)
    }
    const fromHash = () => show(location.hash.slice(1))
    // Clicking the link that is already in the address bar fires no hashchange.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="#for-"]') as HTMLAnchorElement | null
      if (a && a.pathname === location.pathname && a.hash === location.hash) show(a.hash.slice(1))
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    document.addEventListener('click', onClick)
    return () => {
      window.clearTimeout(timer.current)
      window.removeEventListener('hashchange', fromHash)
      document.removeEventListener('click', onClick)
    }
  }, [])
  return spot
}

export function RoleCards() {
  const ref = useReveal<HTMLElement>()
  const spot = useSpotlight()
  return (
    <section id="roles" ref={ref} className="roles" aria-label="Ways to use Bylda" data-spot={spot || undefined}>
      <div className="wrap roles-grid">
        <article id="for-managers" className="role role-manager rv" data-spot={spot === 'for-managers' || undefined}>
          <div className="role-copy">
            <h2 className="role-tagline">{ROLES.manager.tagline}</h2>
            <p className="role-q">{ROLES.manager.question}</p>
            <ul className="role-list">
              {ROLES.manager.points.map(pt => <li key={pt}><CheckCircle size={18} weight="fill" aria-hidden="true" />{pt}</li>)}
            </ul>
          </div>
          <div className="role-fan" aria-hidden="true">
            <BehaviorTable compact limit={6} className="fan fan-1 f-float" style={{ width: 460 }} />
            <PatternCard compact className="fan fan-2 f-float" style={{ width: 460 }} />
            <ManagerView compact className="fan fan-3 f-float" style={{ width: 400 }} />
          </div>
        </article>
        <article id="for-reps" className="role role-rep rv" data-env="black" data-spot={spot === 'for-reps' || undefined} style={{ ['--i' as string]: 1 }}>
          <div className="role-copy">
            <h2 className="role-tagline">{ROLES.rep.tagline}</h2>
            <p className="role-q">{ROLES.rep.question}</p>
            <ul className="role-list">
              {ROLES.rep.points.map(pt => <li key={pt}><CheckCircle size={18} weight="fill" aria-hidden="true" />{pt}</li>)}
            </ul>
          </div>
          <div className="role-fan" aria-hidden="true">
            <CallTimeline compact className="fan fan-1 f-float" style={{ width: 480 }} />
            <BehaviorTable compact limit={6} className="fan fan-2 f-float" style={{ width: 460 }} />
            <FocusCard compact className="fan fan-3" style={{ width: 440 }} />
          </div>
        </article>
      </div>
    </section>
  )
}
