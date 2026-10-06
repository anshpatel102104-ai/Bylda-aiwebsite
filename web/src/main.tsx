import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// Static weights: 24 KB each, against 132 KB for the variable opsz file.
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-500.css'
import '@fontsource/newsreader/latin-400-italic.css'
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/geist-mono/wght.css'
import './tokens.css'
import './styles/base.css'
import './ui/ui.css'
import { App } from './App'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// The build prerenders the page; hydrate it when the HTML is there (dev serves an empty root).
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
