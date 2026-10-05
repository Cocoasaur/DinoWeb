import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import App from './App.jsx'
import { prefetchLazyChunks } from './utils/prefetchPages'
import { ThemeProvider } from './context/ThemeContext'
import { recoverImportFailure } from './utils/loadRecovery'

const LazyUpdatePrompt = lazy(() => import('./components/ui/UpdatePrompt.jsx'))

export default function RootApp() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const applyUpdate = useRef(null)

  useEffect(() => {
    let idleId = 0
    let timerId = 0
    let cancelled = false

    const register = () => {
      import('virtual:pwa-register').then(({ registerSW }) => {
        if (cancelled) return
        applyUpdate.current = registerSW({
          immediate: false,
          updateViaCache: 'none',
          onNeedRefresh() {
            setUpdateAvailable(true)
          },
          onNeedReload() {
            window.location.reload()
          },
        })
        // Also warm section modules on refresh when the worker is already
        // installed. Heavy WebGL/PDF modules remain cached without evaluation.
        navigator.serviceWorker?.ready.then(() => {
          if (!cancelled) return Promise.allSettled(prefetchLazyChunks())
        }).catch(() => {})
      }).catch(recoverImportFailure)
    }

    const scheduleIdle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(register, { timeout: 10000 })
      } else {
        register()
      }
    }

    // Installing a service worker can trigger its precache and lifecycle work.
    // Keep it out of the critical startup window even when the browser reports
    // an early idle slot.
    const schedule = () => {
      timerId = window.setTimeout(scheduleIdle, 5000)
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
      {updateAvailable && (
        <Suspense fallback={null}>
          <LazyUpdatePrompt onUpdate={() => applyUpdate.current?.(true)} />
        </Suspense>
      )}
    </ThemeProvider>
  )
}
