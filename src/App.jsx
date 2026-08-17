import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import MobileBranding from './components/ui/MobileBranding';
import RotatePrompt from './components/ui/RotatePrompt';
import OverlayNavIcon from './components/ui/OverlayNavIcon';
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
  const screenPosRef = useRef({ x: 0, y: 0, valid: false });
  const faceDownPosRef = useRef({ x: 0, y: 0, valid: false });
  const { dpr, tier } = useAdaptiveDPR();
  const reducedMotion = useReducedMotion();

  const {
    isZoomed, isZoomingOut, showOverlay, activeFace, targetRotation,
    zoomZ, coordsRef, isDraggingRef, themeTransitionActive,
    overlayPhase,
    handleFaceClick, handleFacePressStart, handleCloseOverlay,
    handleZoomOutComplete, handleWheel, handlePinchZoom,
    handleRotationChange, updateZoomCoord, handleZoomComplete,
    handleThemeTransitionComplete,
    handleOverlayCloseComplete,
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

    const finish = () => {
      document.documentElement.classList.remove('theme-transitioning');
      document.documentElement.removeAttribute('data-theme-direction');
      transitionInProgressRef.current = false;
      handleThemeTransitionComplete();
    };

    const toggleFallback = () => {
      try {
        toggle();
      } catch {
        // Theme state is unchanged — nothing else to restore.
      }
      finish();
    };

    // No View Transition support, reduced motion, or hidden tab → snap.
    if (!document.startViewTransition || reducedMotion || document.visibilityState === 'hidden') {
      transitionInProgressRef.current = true;
      toggleFallback();
      return;
    }

    // Defer one frame so the browser captures a settled frame instead of
    // one mid-press-animation / mid-main-thread-churn. The guard is taken
    // inside the callback so a dep change in between (e.g. wheel zoom)
    // cancels this rAF and reschedules cleanly instead of wedging.
    const rafId = requestAnimationFrame(() => {
      if (transitionInProgressRef.current) return;
      transitionInProgressRef.current = true;

      const origin = faceDownPosRef.current.valid
        ? faceDownPosRef.current
        : screenPosRef.current.valid
          ? screenPosRef.current
          : getCubeScreenOrigin(zoomZ);
      document.documentElement.style.setProperty('--theme-origin-x', `${origin.x}px`);
      document.documentElement.style.setProperty('--theme-origin-y', `${origin.y}px`);

      // Consume the press position so a later transition (triggered without a
      // fresh pointerdown on the cube — e.g. a stray re-render) can't reuse
      // coordinates from a previous, unrelated face click.
      faceDownPosRef.current.valid = false;

      const direction = isDark ? 'to-light' : 'to-dark';
      document.documentElement.setAttribute('data-theme-direction', direction);

      // Freeze infinitely-animated elements (drift grid, logo trace) so they are
      // captured in the old snapshot instead of live-flipping to the new theme.
      document.documentElement.classList.add('theme-transitioning');
      // Force a reflow so the snapshot captures the frozen state.
      document.documentElement.offsetWidth;

      let vt;
      try {
        vt = document.startViewTransition(() => {
          flushSync(() => { toggle(); });
        });
      } catch {
        toggleFallback();
        return;
      }
      vt.finished.then(finish, finish).catch(() => {});
    });

    return () => cancelAnimationFrame(rafId);
  }, [themeTransitionActive, isDark, toggle, handleThemeTransitionComplete, reducedMotion, zoomZ]);

  // Some mobile browsers don't fire a native `resize` when the tab/search bar
  // collapses or expands. Bridge the visual viewport changes into a synthetic
  // `resize` so the layout hook and the R3F canvas re-frame the scene.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let rafId = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    };

    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);

    return () => {
      cancelAnimationFrame(rafId);
      vv.removeEventListener('resize', onViewportChange);
      vv.removeEventListener('scroll', onViewportChange);
    };
  }, []);

  const isLowEnd = tier === 'low';

  const canvasZIndex = (isZoomed || isZoomingOut) ? 60 : 10;

  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden${isLowEnd ? '' : ' stage-active'}`}
      style={{ minHeight: '100dvh', backgroundColor: 'var(--void-bg)', transition: reducedMotion ? 'none' : 'background-color 0.5s ease' }}
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
            frameloop="demand"
            onCreated={({ gl }) => {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, dpr[1]));
            }}
          >
            <Suspense fallback={null}>
              <Scene
                isLowEnd={isLowEnd}
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
                screenPosRef={screenPosRef}
                faceDownPosRef={faceDownPosRef}
              />
              <Preload all />
            </Suspense>
          </Canvas>
        </div>

        <CornerMarkers />
        <ThemeLabel />
        {!isLowEnd && <Scrubber />}
        <CoordinateDisplay coordsRef={coordsRef} />
        <Footer />
        <MobileBranding />
        {!isZoomed && <RotatePrompt />}
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
            className="portfolio-overlay-close sticky top-5 right-5 z-20 ml-auto text-xl leading-none w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer"
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
            <OverlayNavIcon variant={selectedProject ? 'back' : 'close'} />
          </button>
        ) : undefined}
      />
    </div>
  );
}