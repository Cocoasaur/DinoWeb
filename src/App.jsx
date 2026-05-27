import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import MobileBranding from './components/ui/MobileBranding';
import RotatePrompt from './components/ui/RotatePrompt';
import Scene from './components/three/Scene';
import CornerMarkers from './components/ui/CornerMarkers';
import Sidebar from './components/ui/Sidebar';
import Scrubber from './components/ui/Scrubber';
import ThemeLabel from './components/ui/ThemeLabel';
import CoordinateDisplay from './components/ui/CoordinateDisplay';
import Footer from './components/ui/Footer';
import Overlay from './components/ui/Overlay';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useTheme } from './context/ThemeContext';
import { useAdaptiveDPR } from './hooks/useAdaptiveDPR';
import { useReducedMotion } from './hooks/useReducedMotion';
import { getHomeViewportLayout } from './hooks/useHomeViewportLayout';
import './styles/entrance-animations.css';
import './styles/home-layout.css';
import './styles/about-layout.css';
import './styles/projects-layout.css';

const SCENE_CAMERA_FOV = 45;
const SCENE_CAMERA_Z = 5;

function getCubeScreenOrigin(zoomZ) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { restingX, restingY } = getHomeViewportLayout(width, height);
  const cameraZ = SCENE_CAMERA_Z * (1 + zoomZ / 1000);
  const fov = SCENE_CAMERA_FOV * Math.PI / 180;
  const focal = 1 / Math.tan(fov / 2);
  const aspect = width / height;
  const ndcX = (restingX * focal / aspect) / cameraZ;
  const ndcY = (restingY * focal) / cameraZ;
  const x = Math.round((ndcX + 1) * width / 2);
  const y = Math.round((1 - ndcY) * height / 2);

  return { x, y };
}

export default function App() {
  const { toggle, isDark } = useTheme();
  const transitionInProgressRef = useRef(false);
  const { dpr, tier } = useAdaptiveDPR();
  const reducedMotion = useReducedMotion();

  const {
    isZoomed, isZoomingOut, showOverlay, activeFace, targetRotation,
    zoomZ, coordsRef, isDraggingRef, themeTransitionActive, overlayPhase,
    handleFaceClick, handleFacePressStart, handleCloseOverlay,
    handleZoomOutComplete, handleWheel, handlePinchZoom,
    handleRotationChange, updateZoomCoord, handleZoomComplete,
    handleThemeTransitionComplete, handleOverlayCloseComplete,
  } = useCubeInteraction();

  // ── Lifted project selection state ────────────────────────────────────────
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!showOverlay) setSelectedProject(null);
  }, [showOverlay]);

  useEffect(() => { updateZoomCoord(zoomZ); }, [zoomZ, updateZoomCoord]);

  useEffect(() => {
    const onWheel = (e) => { if (!isZoomed) handleWheel(e); };
    document.addEventListener('wheel', onWheel, { passive: true });
    return () => document.removeEventListener('wheel', onWheel);
  }, [isZoomed, handleWheel]);

  useEffect(() => {
    if (!themeTransitionActive || transitionInProgressRef.current) return;
    transitionInProgressRef.current = true;

    const { x, y } = getCubeScreenOrigin(zoomZ);
    document.documentElement.style.setProperty('--theme-origin-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-origin-y', `${y}px`);

    const direction = isDark ? 'to-light' : 'to-dark';
    document.documentElement.setAttribute('data-theme-direction', direction);

    if (document.startViewTransition && !reducedMotion) {
      const vt = document.startViewTransition(() => {
        flushSync(() => { toggle(); });
      });
      vt.finished.finally(() => {
        document.documentElement.removeAttribute('data-theme-direction');
        transitionInProgressRef.current = false;
        handleThemeTransitionComplete();
      });
    } else {
      toggle();
      document.documentElement.removeAttribute('data-theme-direction');
      transitionInProgressRef.current = false;
      handleThemeTransitionComplete();
    }
  }, [themeTransitionActive, isDark, toggle, handleThemeTransitionComplete, reducedMotion, zoomZ]);

  const isLowEnd = tier === 'low';

  const canvasZIndex = (isZoomed || isZoomingOut) ? 60 : 10;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--void-bg)', transition: reducedMotion ? 'none' : 'background-color 0.5s ease' }}
    >
      <div className="fixed inset-0">
        <div className="fixed inset-0 pointer-events-none z-0 void-grid" />
        {!isLowEnd && (
          <div className="fixed inset-0 pointer-events-none z-0 opacity-50 void-grid-drift" />
        )}

        <Sidebar />

        <div
          className="absolute inset-0 w-full h-full cube-entrance"
          style={{ zIndex: canvasZIndex }}
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
            gl={{
              antialias: tier !== 'low',
              alpha: true,
              powerPreference: tier === 'low' ? 'low-power' : 'high-performance',
              stencil: false,
              depth: true,
            }}
            style={{ width: '100%', height: '100%', display: 'block', cursor: isZoomed ? 'default' : 'grab' }}
            dpr={dpr}
            frameloop={isZoomed || isZoomingOut ? 'always' : 'demand'}
            onCreated={({ gl }) => {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, dpr[1]));
            }}
          >
            <Scene
              onFaceClick={handleFaceClick}
              onFacePressStart={handleFacePressStart}
              targetRotation={targetRotation}
              isZoomed={isZoomed}
              isZoomingOut={isZoomingOut}
              activeFace={activeFace}        // ← ADDED
              zoomZ={zoomZ}
              onRotationChange={handleRotationChange}
              isDraggingRef={isDraggingRef}
              onPinchZoom={handlePinchZoom}
              onZoomComplete={handleZoomComplete}
              onZoomOutComplete={handleZoomOutComplete}
            />
          </Canvas>
        </div>

        <CornerMarkers />
        <ThemeLabel />
        {!isLowEnd && <Scrubber />}
        <CoordinateDisplay coordsRef={coordsRef} />
        <Footer />
        <MobileBranding />
        <RotatePrompt />
      </div>

      <Overlay
        active={showOverlay}
        phase={overlayPhase}
        faceName={activeFace}
        onClose={handleCloseOverlay}
        onCloseComplete={handleOverlayCloseComplete}
        reducedMotion={reducedMotion}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        renderCloseButton={activeFace === 'projects' ? ({ onClose }) => (
          <button
            onClick={selectedProject ? () => setSelectedProject(null) : onClose}
            className="portfolio-overlay-close sticky top-5 right-5 z-20 ml-auto text-xl w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer"
            style={{
              fontFamily: "'Space Grotesk', monospace",
              color: 'var(--void-text-full)',
              backgroundColor: 'var(--void-btn-bg)',
              borderColor: 'var(--void-btn-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
              e.currentTarget.style.borderColor = 'var(--void-text-dim)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--void-btn-bg)';
              e.currentTarget.style.borderColor = 'var(--void-btn-border)';
            }}
          >
            {selectedProject ? '←' : '✕'}
          </button>
        ) : undefined}
      />
    </div>
  );
}