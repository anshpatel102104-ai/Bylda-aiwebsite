import { STATEMENT } from '../../data/site'

/**
 * One sentence on Black. Each word lights from black/raised grey to pearl as
 * it scrolls through the viewport: a CSS scroll-driven animation, so no
 * script and no scroll listener. Without support it renders fully lit.
 */
export function Statement() {
  const words = STATEMENT.split(' ')
  return (
    <section className="statement" data-env="black" data-nav-dark aria-label="Statement">
      <div className="wrap">
        <p className="statement-text">
          {words.map((w, i) => (
            <span key={i} className="sw" style={{ ['--i' as string]: i, ['--n' as string]: words.length }}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  )
}
