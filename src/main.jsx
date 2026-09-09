import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/space-grotesk/latin-700.css'
import './index.css'
import './styles/boot-screen.css'
import { loadDeferredStyles } from './utils/deferredLoad'
import RootApp from './RootApp.jsx'

const root = createRoot(document.getElementById('root'))

// Warms secondary fonts + animation/layout CSS after first paint (idle callback).
loadDeferredStyles()

root.render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
