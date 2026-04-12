import '@fontsource/red-hat-mono/400.css'
import '@fontsource/red-hat-mono/500.css'
import '@fontsource/red-hat-mono/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)
