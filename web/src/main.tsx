import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// Brand and product: Lexend. Data: Inter, for its tabular figures (see tokens.css).
import '@fontsource-variable/lexend/wght.css'
import '@fontsource-variable/inter/wght.css'
// App fragments (Prototypes F): Lexend Exa for app headlines, Fira Code for labels and data.
import '@fontsource-variable/lexend-exa/wght.css'
import '@fontsource-variable/fira-code/wght.css'
import './tokens.css'
import './styles/base.css'
import './ui/ui.css'
import { App } from './App'

// Scroll reveals only hide content once JavaScript is running.
document.documentElement.classList.add('js')
const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App path={window.location.pathname} />
  </StrictMode>
)
// The build prerenders the page; hydrate it when the HTML is there (dev serves an empty root).
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
