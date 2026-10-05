import './index.css'
import './styles/boot-screen.css'
import './styles/stage-backdrop.css'
import { installLoadRecovery, handleAppLoadFailure, recoverImportFailure } from './utils/loadRecovery'

installLoadRecovery()

// Paint the HTML loader before downloading or evaluating React. The app and
// its scene facade then load together; real 3D still starts automatically.
requestAnimationFrame(() => requestAnimationFrame(() => {
  void import('./renderApp.jsx').then(({ mountPortfolio }) => mountPortfolio()).catch(handleAppLoadFailure)
  // This only warms the lightweight facade, not the Three.js fallback.
  void import('./components/three/CubeStage.jsx').catch(recoverImportFailure)
}))
