import './index.css'
import './styles/boot-screen.css'
import './styles/stage-backdrop.css'
import { installLoadRecovery, handleAppLoadFailure, recoverImportFailure } from './utils/loadRecovery'

installLoadRecovery()

// Paint the HTML loader before downloading or evaluating React. The app and
// its scene facade then load together; real 3D still starts automatically.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const splinePrototype = new URLSearchParams(window.location.search).get('prototype') === 'spline'
  // Separate import sites let Vite associate each entry with its own CSS.
  if (splinePrototype) {
    void import('./prototype/renderSplinePrototype.jsx').then(({ mountPortfolio }) => mountPortfolio()).catch(handleAppLoadFailure)
  } else {
    void import('./renderApp.jsx').then(({ mountPortfolio }) => mountPortfolio()).catch(handleAppLoadFailure)
    void import('./components/three/CubeStage.jsx').catch(recoverImportFailure)
  }
}))
