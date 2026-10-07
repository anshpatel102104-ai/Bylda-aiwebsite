import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// Brand: Söhne Kräftig. Product: SF Pro Display. Data: gg sans.
// All three are licensed fonts; these are the free stand-ins behind them (see tokens.css).
import '@fontsource-variable/schibsted-grotesk/wght.css'
import '@fontsource-variable/inter/wght.css'
import './tokens.css'
import './styles/base.css'
import './ui/ui.css'
import { App } from './App'

// Scroll reveals only hide content once JavaScript is running.
document.documentElement.classList.add('js')
const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// The build prerenders the page; hydrate it when the HTML is there (dev serves an empty root).
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
