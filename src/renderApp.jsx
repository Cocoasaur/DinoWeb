import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/hero-font.css'
import { loadDeferredStyles } from './utils/deferredLoad'
import RootApp from './RootApp.jsx'

// Mount only after the app import has loaded its CSS. The scene prewarm can
// import shared modules sooner without committing an unstyled homepage.
export function mountPortfolio() {
  const root = createRoot(document.getElementById('root'))

  // Warms secondary fonts + animation/layout CSS after first paint (idle callback).
  loadDeferredStyles()

  root.render(
    <StrictMode>
      <RootApp />
    </StrictMode>,
  )
}
