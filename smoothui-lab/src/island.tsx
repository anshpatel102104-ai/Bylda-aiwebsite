import { createRoot } from 'react-dom/client'
import BlackHoleHero from './components/bylda/black-hole'

/**
 * Entry point for the static site.
 *
 * usebylda.com is hand-written HTML with no React, so the black hole ships as a
 * self-contained island: this bundle carries its own React and mounts into a
 * single empty div in the hero. Nothing else on the page knows it exists.
 *
 * The mark is switched off here. The static hero already shows the ghost at
 * 380px, front and centre — rendering a second one in the sky would be
 * competing with it rather than incorporating it, and a silver mark against a
 * greyscale hole is the better composition anyway.
 */
const el = document.getElementById('bh-hero')
if (el) createRoot(el).render(<BlackHoleHero ghost={0} />)
