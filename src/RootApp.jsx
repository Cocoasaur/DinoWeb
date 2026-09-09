import { Suspense, lazy, useEffect, useState } from 'react'
import App from './App.jsx'
import BootScreen from './components/ui/BootScreen.jsx'
import { ThemeProvider } from './context/ThemeContext'

const LazyUpdatePrompt = lazy(() => import('./components/ui/UpdatePrompt.jsx'))

export default function RootApp() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let idleId = 0
    let timerId = 0
    let cancelled = false

    const register = () => {
      import('virtual:pwa-register').then(({ registerSW }) => {
        if (cancelled) return
        registerSW({
          immediate: false,
          updateViaCache: 'none',
          onNeedReload() {
            setUpdateAvailable(true)
          },
        })
      })
    }

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(register, { timeout: 10000 })
      } else {
        timerId = window.setTimeout(register, 3000)
      }
    }

    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', schedule)
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      window.clearTimeout(timerId)
    }
  }, [])

  return (
    <ThemeProvider>
      <App />
      <BootScreen />
      {updateAvailable && (
        <Suspense fallback={null}>
          <LazyUpdatePrompt />
        </Suspense>
      )}
    </ThemeProvider>
  )
}
