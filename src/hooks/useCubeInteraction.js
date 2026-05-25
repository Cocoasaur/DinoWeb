import { useState, useCallback, useRef, useEffect } from 'react';
import { FACE_ROTATIONS, ZOOM_MIN, ZOOM_MAX, DEFAULT_ROTATION } from '../constants/cubeConfig';

// ─── Overlay phase lifecycle ──────────────────────────────────────────────────
//
//  hidden          → camera idle, no overlay
//  fading-in       → zoom just completed, overlay is transitioning IN  (≈600ms)
//  open            → overlay fully visible and interactive
//  fading-out      → user closed overlay, overlay transitioning OUT    (≈600ms)
//  bg-restoring    → overlay gone, background UI fading back in        (≈500ms)
//  ready-to-zoom-out → zoom-out animation starts
//
// ─────────────────────────────────────────────────────────────────────────────

export function useCubeInteraction() {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [activeFace, setActiveFace] = useState(null);
    const [targetRotation, setTargetRotation] = useState(null);
    const [zoomZ, setZoomZ] = useState(0);
    const [themeTransitionActive, setThemeTransitionActive] = useState(false);
    const [overlayPhase, setOverlayPhase] = useState('hidden');
    const isDraggingRef = useRef(false);
    const phaseTimeoutRef = useRef(null);

    const coordsRef = useRef({
        x: DEFAULT_ROTATION.x,
        y: DEFAULT_ROTATION.y,
        z: 0,
    });

    const clearPhaseTimeout = useCallback(() => {
        if (phaseTimeoutRef.current) {
            clearTimeout(phaseTimeoutRef.current);
            phaseTimeoutRef.current = null;
        }
    }, []);

    const advanceToBgRestoring = useCallback(() => {
        clearPhaseTimeout();
        setOverlayPhase('bg-restoring');
        setShowOverlay(false);
        phaseTimeoutRef.current = setTimeout(() => {
            setOverlayPhase('ready-to-zoom-out');
            setIsZoomingOut(true);
        }, 100);
    }, [clearPhaseTimeout]);

    const handleFaceClick = useCallback((faceName) => {
        if (faceName === 'theme') {
            setThemeTransitionActive(true);
            return;
        }

        const target = FACE_ROTATIONS[faceName];
        if (!target) return;

        clearPhaseTimeout();

        setTargetRotation(target);
        setActiveFace(faceName);
        setIsZoomed(true);
        setIsZoomingOut(false);
        setShowOverlay(false);
        setOverlayPhase('hidden');
        coordsRef.current = { x: target.x, y: target.y, z: coordsRef.current.z };
    }, [clearPhaseTimeout]);

    const handleFacePressStart = useCallback(() => {
        clearPhaseTimeout();
    }, [clearPhaseTimeout]);

    const handleZoomComplete = useCallback(() => {
        clearPhaseTimeout();

        // No pre-delay — dissolve starts the moment zoom completes.
        // Mount the overlay and immediately begin its fade-in transition.
        setShowOverlay(true);
        setOverlayPhase('fading-in');

        // After the fade-in duration (600ms) mark it fully open.
        phaseTimeoutRef.current = setTimeout(() => {
            setOverlayPhase('open');
        }, 600);
    }, [clearPhaseTimeout]);

    const handleCloseOverlay = useCallback(() => {
        clearPhaseTimeout();

        // Begin overlay fade-out.
        setOverlayPhase('fading-out');

        // After fade-out completes, restore background and start zoom-out.
        // Safety: advanceToBgRestoring also cancels any leftover timeout.
        phaseTimeoutRef.current = setTimeout(advanceToBgRestoring, 650);
    }, [clearPhaseTimeout, advanceToBgRestoring]);

    // Called by Overlay when its own CSS transition ends (optional fast-path).
    // If the timeout above fires first, this is a no-op (clearPhaseTimeout prevents double-fire).
    const handleOverlayCloseComplete = useCallback(() => {
        advanceToBgRestoring();
    }, [advanceToBgRestoring]);

    const handleZoomOutComplete = useCallback(() => {
        setIsZoomingOut(false);
        setIsZoomed(false);
        setActiveFace(null);
        setTargetRotation(null);
        setOverlayPhase('hidden');
        coordsRef.current = {
            x: DEFAULT_ROTATION.x,
            y: DEFAULT_ROTATION.y,
            z: coordsRef.current.z,
        };
    }, []);

    const handleThemeTransitionComplete = useCallback(() => {
        setThemeTransitionActive(false);
    }, []);

    const handleWheel = useCallback((e) => {
        setZoomZ(prev => {
            const next = prev - e.deltaY * 0.5;
            return Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX);
        });
    }, []);

    const handlePinchZoom = useCallback((distanceDelta) => {
        setZoomZ(prev => {
            const next = prev - distanceDelta * 0.75;
            return Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX);
        });
    }, []);

    const handleRotationChange = useCallback((x, y) => {
        coordsRef.current.x = x;
        coordsRef.current.y = y;
    }, []);

    const updateZoomCoord = useCallback((z) => {
        coordsRef.current.z = z;
    }, []);

    useEffect(() => {
        return () => clearPhaseTimeout();
    }, [clearPhaseTimeout]);

    return {
        isZoomed, isZoomingOut, showOverlay, activeFace, targetRotation,
        zoomZ, coordsRef, isDraggingRef, themeTransitionActive, overlayPhase,
        handleFaceClick, handleFacePressStart, handleCloseOverlay,
        handleZoomOutComplete, handleWheel, handlePinchZoom,
        handleRotationChange, updateZoomCoord, handleZoomComplete,
        handleThemeTransitionComplete, handleOverlayCloseComplete,
    };
}
