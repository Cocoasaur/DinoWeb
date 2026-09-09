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
import { useCubeInteraction } from './hooks/useCubeInteraction';
import { useTheme } from './context/ThemeContext';
import { useAdaptiveDPR } from './hooks/useAdaptiveDPR';
import { useReducedMotion } from './hooks/useReducedMotion';
import { usePortfolioViewportSize } from './hooks/usePortfolioViewportSize';
import { getHomeViewportLayout } from './hooks/useHomeViewportLayout';
import dinoIcon from './assets/brand/dino-icon.webp';
import './styles/home-layout.css';

// The 3D stage chunks (three / drei / fiber) are deferred until the hero
// (LCP) has painted. Loaded lazily so Vite emits them as a dynamic chunk
// rather than eagerly modulepreloading them in index.html.
const LazyCubeStage = lazy(() => import('./components/three/CubeStage'));

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
  const { dpr, tier, isMobile } = useAdaptiveDPR();
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
    handleOverlayCloseComplete,
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
  const reduceEffects = isLowEnd || isMobile;

  const canvasZIndex = (isZoomed || isZoomingOut) ? 60 : 10;

  // ── Deferred 3D mount ──────────────────────────────────────────────────
  // Lets the hero (LCP) paint before pulling in the heavy three/drei chunks.
  //   high   → first animation frame
  //   medium → first idle slot
  //   low    → first idle slot AND first pointer gesture (protect weak devices)
  //   mobile → explicit opt-in; WebGL startup is expensive on throttled phones
  const [stageReady, setStageReady] = useState(false);
  useEffect(() => {
    let rafId = 0;
    let idleId = 0;
    let onGesture = null;

    const mountNow = () => setStageReady(true);

    const scheduleForTier = () => {
      // Keep the initial mobile page responsive. A CSS cube below preserves
      // the composition until the visitor asks for the full WebGL experience.
      if (isMobile) return;

      if (tier === 'high' && !isMobile) {
        rafId = requestAnimationFrame(mountNow);
        return;
      }
      const fn = () => setStageReady(true);
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(fn, { timeout: 2500 });
      } else {
        idleId = window.setTimeout(fn, 400);
      }
      if (tier === 'low') {
        onGesture = () => {
          mountNow();
          window.removeEventListener('pointerdown', onGesture);
          window.removeEventListener('touchstart', onGesture);
        };
        window.addEventListener('pointerdown', onGesture, { passive: true, once: true });
        window.addEventListener('touchstart', onGesture, { passive: true, once: true });
      }
    };

    // Defer one frame so the hero text paints first.
    rafId = requestAnimationFrame(scheduleForTier);
    return () => {
      cancelAnimationFrame(rafId);
      if (idleId && window.cancelIdleCallback) cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      if (onGesture) {
        window.removeEventListener('pointerdown', onGesture);
        window.removeEventListener('touchstart', onGesture);
      }
    };
  }, [tier, isMobile]);

  return (
    <div
      className={`portfolio-viewport${reduceEffects ? '' : ' stage-active'}`}
      style={{ backgroundColor: 'var(--void-bg)', transition: reducedMotion ? 'none' : 'background-color 0.5s ease' }}
    >
      <div className="portfolio-viewport__stage">
        <div className="absolute inset-0 pointer-events-none z-0 void-grid" />
        {!reduceEffects && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-50 void-grid-drift" />
        )}

        <Sidebar />

        {stageReady ? (
          <Suspense fallback={null}>
            <LazyCubeStage
              dpr={dpr}
              isLowEnd={isLowEnd}
              reduceEffects={reduceEffects}
              isZoomed={isZoomed}
              isZoomingOut={isZoomingOut}
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
            />
          </Suspense>
        ) : isMobile ? (
          <button
            type="button"
            className="mobile-cube-loader cube-entrance"
            style={{ zIndex: canvasZIndex }}
            onClick={() => setStageReady(true)}
            aria-label="Load the interactive 3D portfolio cube"
          >
            <span className="mobile-cube-loader__cube" aria-hidden="true">
              <span className="mobile-cube-loader__face mobile-cube-loader__face--front">
                <img src={dinoIcon} alt="" width="76" height="76" />
              </span>
              <span className="mobile-cube-loader__face mobile-cube-loader__face--right">PROJECTS</span>
              <span className="mobile-cube-loader__face mobile-cube-loader__face--top">ABOUT</span>
            </span>
            <span className="mobile-cube-loader__label">TAP TO EXPLORE IN 3D</span>
          </button>
        ) : (
          <div className="absolute inset-0 w-full h-full cube-entrance" style={{ zIndex: canvasZIndex }} />
        )}

        <CornerMarkers />
        <ThemeLabel />
        {!reduceEffects && <Scrubber />}
        <CoordinateDisplay coordsRef={coordsRef} />
        <Footer />
        <MobileBranding />
        {!isZoomed && (
          <RotatePrompt label={isMobile && !stageReady ? 'TAP THE CUBE TO LOAD 3D' : 'ROTATE THE CUBE'} />
        )}
      </div>

      <Overlay
        active={showOverlay}
        phase={overlayPhase}
        faceName={activeFace}
        onClose={() => {
          setSelectedProject(null);
          handleCloseOverlay();
        }}
        onCloseComplete={handleOverlayCloseComplete}
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
      />
    </div>
  );
}
