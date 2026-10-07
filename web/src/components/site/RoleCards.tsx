import { CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { ROLES } from '../../data/site'
import { useReveal } from '../../lib/reveal'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { FocusCard } from '../../ui/FocusCard'
import { ManagerView } from '../../ui/ManagerView'
import { PatternCard } from '../../ui/PatternCard'

/** Two ways to use it. Same product, two levels of complexity: managers get the pattern, reps get relevance. */
export function RoleCards() {
  const ref = useReveal<HTMLElement>()
  return (
    <section id="roles" ref={ref} className="roles" aria-label="Ways to use Bylda">
      <div className="wrap roles-grid">
        <article className="role role-manager rv">
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
        <article className="role role-rep rv" data-env="black" style={{ ['--i' as string]: 1 }}>
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
