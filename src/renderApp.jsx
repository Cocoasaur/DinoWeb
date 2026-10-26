import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/hero-font.css'
import { startPortfolioPreload } from './utils/portfolioPreload'
import RootApp from './RootApp.jsx'
import AppErrorBoundary from './components/ui/AppErrorBoundary.jsx'

// Mount only after the app import has loaded its CSS. The scene prewarm can
// import shared modules sooner without committing an unstyled homepage.
export function mountPortfolio() {
  const root = createRoot(document.getElementById('root'))

  // The loader covers the scene until the complete local asset queue settles.
  void startPortfolioPreload()

  root.render(
    <StrictMode>
      <AppErrorBoundary><RootApp /></AppErrorBoundary>
    </StrictMode>,
  )
}
