import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { flushSync } from 'react-dom';
import MobileBranding from './components/ui/MobileBranding';
import RotatePrompt from './components/ui/RotatePrompt';
import OverlayNavIcon from './components/ui/OverlayNavIcon';
import CornerMarkers from './components/ui/CornerMarkers';
import Sidebar from './components/ui/Sidebar';
import Scrubber from './components/ui/Scrubber';
import ThemeLabel from './components/ui/ThemeLabel';
import CoordinateDisplay from './components/ui/CoordinateDisplay';
import Footer from './components/ui/Footer';
import Overlay from './components/ui/Overlay';
import BootScreen from './components/ui/BootScreen';
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useTheme } from './context/ThemeContext';
import { useAdaptiveDPR } from './hooks/useAdaptiveDPR';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useHomeGridMotion } from './hooks/useHomeGridMotion';
import { usePortfolioViewportSize } from './hooks/usePortfolioViewportSize';
import { getHomeViewportLayout } from './hooks/useHomeViewportLayout';
import './styles/home-layout.css';
import { RenderProfileContext } from './context/RenderProfileContext';

// Start the scene automatically. The boot overlay stays up until its first
// rendered frame, then reveals the real interactive cube.
const LazyCubeStage = lazy(async () => {
  // Paint the loader before evaluating/initializing the renderer. Preloaded
  // modules download in parallel, but do not monopolize the first paint.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const stage = await import('./components/three/CubeStage');
  await stage.default.prepareResources();
  return stage;
});

const SCENE_CAMERA_FOV = 45;
const SCENE_CAMERA_Z = 5;

function getCubeScreenOrigin(zoomZ) {
  const viewport = document.querySelector('.portfolio-viewport');
  const width = viewport?.clientWidth || window.innerWidth;
  const height = viewport?.clientHeight || window.innerHeight;
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
  const { dpr, tier, isMobile, labelScale } = useAdaptiveDPR();
  const reducedMotion = useReducedMotion();
  usePortfolioViewportSize();

  const {
    isZoomed, isZoomingOut, showOverlay, activeFace, targetRotation,
    zoomZ, coordsRef, isDraggingRef, themeTransitionActive,
    overlayPhase,
    handleFaceClick, handleFacePressStart, handleCloseOverlay,
    handleZoomOutComplete, handleWheel, handlePinchZoom,
    handleRotationChange, updateZoomCoord, handleZoomComplete,
    handleThemeTransitionComplete,
    handleOverlayCloseComplete, handleOverlayOpenComplete,
  } = useCubeInteraction();

  // ── Lifted project selection state ────────────────────────────────────────
  const [selectedProject, setSelectedProject] = useState(null);

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

  const isLowEnd = tier === 'low';
  const reduceEffects = tier !== 'high' || isMobile || reducedMotion;

  const canvasZIndex = (isZoomed || isZoomingOut) ? 60 : 10;

  const [stagePainted, setStagePainted] = useState(false);
  const viewportRef = useRef(null);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const homeMotionPaused = !pageVisible || !stagePainted || isZoomed || isZoomingOut || themeTransitionActive;
  useHomeGridMotion(viewportRef, { paused: homeMotionPaused, reducedMotion, lowEnd: isLowEnd });

  return (
    <RenderProfileContext.Provider value={{ reduceEffects, labelScale, tier }}>
    <div
      ref={viewportRef}
      data-home-motion-paused={homeMotionPaused}
      className={`portfolio-viewport${stagePainted ? ' stage-active' : ''}`}
      style={{ backgroundColor: 'var(--void-bg)', transition: reducedMotion ? 'none' : 'background-color 0.5s ease' }}
    >
      <div className="portfolio-viewport__stage">
        <div className="home-grid-parallax" aria-hidden="true">
          <div className="absolute inset-0 void-grid" />
          <div className="absolute inset-0 opacity-50 void-grid-drift" />
        </div>

        <Sidebar />

          <Suspense fallback={null}>
            <LazyCubeStage
              dpr={dpr}
              labelScale={labelScale}
              isLowEnd={isLowEnd}
              reduceEffects={reduceEffects}
              isZoomed={isZoomed}
              isZoomingOut={isZoomingOut}
              overlayPhase={overlayPhase}
              canvasZIndex={canvasZIndex}
              handleFaceClick={handleFaceClick}
              handleFacePressStart={handleFacePressStart}
              targetRotation={targetRotation}
              activeFace={activeFace}
              zoomZ={zoomZ}
              handleRotationChange={handleRotationChange}
              isDraggingRef={isDraggingRef}
              handlePinchZoom={handlePinchZoom}
              handleZoomComplete={handleZoomComplete}
              handleZoomOutComplete={handleZoomOutComplete}
              screenPosRef={screenPosRef}
              faceDownPosRef={faceDownPosRef}
              onReady={() => setStagePainted(true)}
            />
          </Suspense>

        <CornerMarkers />
        <ThemeLabel />
        {!reduceEffects && <Scrubber />}
        <CoordinateDisplay coordsRef={coordsRef} paused={overlayPhase === 'open'} />
        <Footer />
        <MobileBranding />
        {!isZoomed && (
          <RotatePrompt />
        )}
      </div>

      <BootScreen ready={stagePainted} />
      {showOverlay && <Overlay
        phase={overlayPhase}
        faceName={activeFace}
        onClose={handleCloseOverlay}
        onCloseComplete={() => {
          handleOverlayCloseComplete();
          setSelectedProject(null);
        }}
        onOpenComplete={handleOverlayOpenComplete}
        reduceEffects={reduceEffects}
        reducedMotion={reducedMotion}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        renderCloseButton={activeFace === 'projects' ? ({ onClose }) => (
          <button
            type="button"
            aria-label={selectedProject ? 'Back to projects' : 'Close projects'}
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
      />}
    </div>
    </RenderProfileContext.Provider>
  );
}
