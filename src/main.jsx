import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-700.css'
import './index.css'
import './styles/scrollbar.css'
import App from './App.jsx'
import UpdatePrompt from './components/ui/UpdatePrompt.jsx'
import { ThemeProvider } from './context/ThemeContext'

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

registerSW({
    immediate: true,
    onNeedReload() {
        root.render(
            <StrictMode>
                <ThemeProvider>
                    <App />
                    <UpdatePrompt />
                </ThemeProvider>
            </StrictMode>,
        );
    },
})