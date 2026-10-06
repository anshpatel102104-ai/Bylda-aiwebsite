import { Logo } from './brand/Logo'
import { Showreel } from './components/Showreel/Showreel'
import { setPauseAnimations, usePauseAnimations } from './lib/prefs'

/**
 * Milestone 1 preview: the showreel on its own, for approval before the rest
 * of the page is built around it.
 */
export function App() {
  const paused = usePauseAnimations()
  return (
    <main>
      <header className="wrap preview-bar">
        <Logo tone="light" height={18} />
        <span className="eyebrow">Preview · showreel milestone</span>
        <button type="button" className="preview-toggle" aria-pressed={paused} onClick={() => setPauseAnimations(!paused)}>
          {paused ? 'Resume animations' : 'Pause animations'}
        </button>
      </header>
      <section className="wrap showreel-section" aria-labelledby="showreel-title">
        <a className="reel-link" href="#showreel">
          <span className="reel-live" aria-hidden="true"><i /><i /><i /></span>
          Watch it run, no clicks needed
        </a>
        <h1 id="showreel-title" className="display-hero">See what your team does when you are not on the call.</h1>
        <div id="showreel"><Showreel /></div>
      </section>
    </main>
  )
}
